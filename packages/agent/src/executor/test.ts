import { privateKeyToAccount } from "viem/accounts";
import { decrypt } from "../utils/crypto.js";

import {
  toMetaMaskSmartAccount,
  Implementation,
  ExecutionMode,
} from "@metamask/smart-accounts-kit";

import {
  http,
  encodeFunctionData,
  concat,
  encodePacked,
  createPublicClient,
  toHex,
} from "viem";

import { prepareUserOperation } from "viem/account-abstraction";

import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

import type {
  Adapter,
  ProposedTransaction,
  AdapterContext,
} from "../adapters/types.js";

export interface Session {
  address: `0x${string}`;
  encryptedPrivateKey: string;
  deployParams: [
    owner: `0x${string}`,
    keyIds: string[],
    xValues: bigint[],
    yValues: bigint[]
  ];
}

export interface InstalledAdapterData {
  config: Record<string, any>;
  permissionId?: number;
}

export interface ExecuteInput {
  userAddress: `0x${string}`;
  adapter: Adapter;
  session: Session;
  installedAdapterData: InstalledAdapterData;
  runtimeParams?: Record<string, any>;
  permissionDelegationData: any;
}

export class Executor {
  async executeAdapter(input: ExecuteInput) {
    const {
      userAddress,
      adapter,
      session,
      installedAdapterData,
      runtimeParams,
      permissionDelegationData,
    } = input;

    console.log(`\n=== Executing adapter ${adapter.id} for ${userAddress} ===`);

    /* ──────────────────────────────── */
    /* Decrypt signer                   */
    /* ──────────────────────────────── */

    const privateKey = decrypt(session.encryptedPrivateKey) as `0x${string}`;
    const signerAccount = privateKeyToAccount(privateKey);

    /* ──────────────────────────────── */
    /* Public client                    */
    /* ──────────────────────────────── */

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    });

    /* ──────────────────────────────── */
    /* Smart Account                    */
    /* ──────────────────────────────── */

    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: session.deployParams,
      deploySalt: "0x",
      signer: { account: signerAccount },
    });

    console.log("Smart account address:", smartAccount.address);

    /* ──────────────────────────────── */
    /* Adapter execution                */
    /* ──────────────────────────────── */

    const adapterContext: AdapterContext = {
      userAddress,
      config: installedAdapterData.config,
      permissionData: permissionDelegationData,
      runtimeParams,
    };

    const proposedTx: ProposedTransaction | null =
      await adapter.proposeTransaction(adapterContext);

    if (!proposedTx) {
      return {
        success: true,
        decision: "ALLOW" as const,
        reason: "No transaction required",
      };
    }

    console.log(`Proposed: ${proposedTx.description}`);

    /* ──────────────────────────────── */
    /* Encode delegation execution      */
    /* ──────────────────────────────── */

    const executionEncoded = concat([
      proposedTx.target as `0x${string}`,
      encodePacked(["uint256"], [proposedTx.value || 0n]),
      proposedTx.callData as `0x${string}`,
    ]);

    const redeemCallData = encodeFunctionData({
      abi: [
        {
          name: "redeemDelegations",
          type: "function",
          stateMutability: "payable",
          inputs: [
            { name: "permissionsContexts", type: "bytes[]" },
            { name: "modes", type: "bytes32[]" },
            { name: "executionCallDatas", type: "bytes[]" },
          ],
          outputs: [],
        },
      ],
      functionName: "redeemDelegations",
      args: [
        [permissionDelegationData.context],
        [ExecutionMode.SingleDefault],
        [executionEncoded],
      ],
    });

    /* ──────────────────────────────── */
    /* Pimlico paymaster                */
    /* ──────────────────────────────── */

    const pimlicoClient = createPimlicoClient({
      chain: sepolia,
      transport: http(process.env.BUNDLER_URL!),
      entryPoint: { address: entryPoint07Address, version: "0.7" },
    });

    /* ──────────────────────────────── */
    /* Bundler client                   */
    /* ──────────────────────────────── */

    const bundlerClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.BUNDLER_URL),
    });

    try {
      /* ──────────────────────────────── */
      /* 1. Prepare UserOperation         */
      /* ──────────────────────────────── */

      let userOperation = await prepareUserOperation(publicClient, {
        account: smartAccount,
        entryPoint: entryPoint07Address,
        calls: [
          {
            to: permissionDelegationData.signerMeta.delegationManager,
            data: redeemCallData,
            value: 0n,
          },
        ],
      });

      console.log("Initial UserOp prepared");

      /* ──────────────────────────────── */
      /* 2. Sponsor via Pimlico           */
      /* ──────────────────────────────── */

      // Extract only the fields Pimlico expects
      const userOpForSponsorship = {
        sender: userOperation.sender,
        nonce: userOperation.nonce,
        callData: userOperation.callData,
        callGasLimit: userOperation.callGasLimit,
        verificationGasLimit: userOperation.verificationGasLimit,
        preVerificationGas: userOperation.preVerificationGas,
        maxFeePerGas: userOperation.maxFeePerGas,
        maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
        signature: userOperation.signature,
      };

      const sponsored = await pimlicoClient.sponsorUserOperation({
        userOperation: userOpForSponsorship as any,
      });

      console.log("UserOp sponsored by paymaster");

      // Merge sponsored fields back
      userOperation = {
        ...userOperation,
        ...sponsored,
      } as typeof userOperation;

      /* ──────────────────────────────── */
      /* 3. Sign with Smart Account       */
      /* ──────────────────────────────── */

      // Use the smart account's signUserOperation method
      // This handles the proper signature format for Hybrid accounts
      const signature = await smartAccount.signUserOperation(
        userOperation as any
      );

      console.log("UserOp signed");

      const signedUserOperation = {
        ...userOperation,
        signature,
      };

      /* ──────────────────────────────── */
      /* 4. Broadcast                     */
      /* ──────────────────────────────── */

      // Prepare userOp for bundler - ensure all numeric fields are hex strings
      const userOpForBundler = {
        sender: signedUserOperation.sender,
        nonce: toHex(signedUserOperation.nonce),
        callData: signedUserOperation.callData,
        callGasLimit: toHex(signedUserOperation.callGasLimit),
        verificationGasLimit: toHex(signedUserOperation.verificationGasLimit),
        preVerificationGas: toHex(signedUserOperation.preVerificationGas),
        maxFeePerGas: toHex(signedUserOperation.maxFeePerGas),
        maxPriorityFeePerGas: toHex(signedUserOperation.maxPriorityFeePerGas),
        signature: signedUserOperation.signature,
        ...(signedUserOperation.paymaster && {
          paymaster: signedUserOperation.paymaster,
          paymasterVerificationGasLimit: toHex(
            signedUserOperation.paymasterVerificationGasLimit || 0n
          ),
          paymasterPostOpGasLimit: toHex(
            signedUserOperation.paymasterPostOpGasLimit || 0n
          ),
          paymasterData: signedUserOperation.paymasterData || "0x",
        }),
      };

      const sentUserOpHash = (await bundlerClient.request({
        method: "eth_sendUserOperation" as any,
        params: [userOpForBundler, entryPoint07Address],
      })) as `0x${string}`;

      console.log("UserOp sent:", sentUserOpHash);

      /* ──────────────────────────────── */
      /* 5. Receipt                      */
      /* ──────────────────────────────── */

      // Wait for receipt with polling
      let receipt: any = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (!receipt && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          receipt = await bundlerClient.request({
            method: "eth_getUserOperationReceipt" as any,
            params: [sentUserOpHash],
          });
        } catch (error) {
          // Receipt not ready yet, continue polling
        }
        attempts++;
        console.log(
          `Polling for receipt... attempt ${attempts}/${maxAttempts}`
        );
      }

      if (!receipt) {
        return {
          success: false,
          decision: "ERROR" as const,
          reason: "Transaction receipt not found after polling",
          userOpHash: sentUserOpHash,
        };
      }

      return {
        success: true,
        decision: "ALLOW" as const,
        reason: "Transaction approved and executed",
        txHash: receipt?.receipt?.transactionHash,
        userOpHash: sentUserOpHash,
      };
    } catch (error) {
      console.error("Execution error:", error);
      return {
        success: false,
        decision: "ERROR" as const,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const executor = new Executor();
