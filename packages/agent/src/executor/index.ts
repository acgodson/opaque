import {
  ExecutionMode,
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/smart-accounts-kit";

import {
  http,
  encodeFunctionData,
  concat,
  encodePacked,
  createPublicClient,
  toHex,
} from "viem";

import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import type {
  Adapter,
  ProposedTransaction,
  AdapterContext,
} from "../adapters/types.js";

export interface Session {
  address: `0x${string}`;
  sessionAccountId: string; // For enclave-based signing
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

export interface ExecutorEnclaveClient {
  signUserOperation(request: {
    sessionAccountId: string;
    preparedUserOperation: any;
    proposedTx: ProposedTransaction;
    policyRules: any[];
    signals: any;
    context: {
      userAddress: `0x${string}`;
      adapterId: string;
      lastExecutionTime?: string;
    };
  }): Promise<{
    allowed: boolean;
    decision: string;
    signature?: `0x${string}`;
    userOpHash?: `0x${string}`;
    reason?: string;
    policyDecisions?: any[];
  }>;
}

export interface ExecuteInput {
  userAddress: `0x${string}`;
  adapter: Adapter;
  session: Session;
  installedAdapterData: InstalledAdapterData;
  runtimeParams?: Record<string, any>;
  permissionDelegationData: any;
  policyRules: any[];
  signals: any;
  lastExecutionTime?: Date;
  enclaveClient?: ExecutorEnclaveClient; // Optional enclave client for offline signing
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
      policyRules,
      signals,
      lastExecutionTime,
      enclaveClient,
    } = input;

    console.log(`\n=== Executing adapter ${adapter.id} for ${userAddress} ===`);

    if (!enclaveClient) {
      throw new Error("Enclave client is required for offline signing");
    }

    if (!session.sessionAccountId) {
      throw new Error(`Session missing sessionAccountId. Session keys: ${Object.keys(session).join(", ")}`);
    }

    /* ──────────────────────────────── */
    /* Public client                    */
    /* ──────────────────────────────── */

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    });

    const dummyAccount = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`);
    
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: session.deployParams,
      deploySalt: "0x",
      signer: { account: dummyAccount },
    });

    if (smartAccount.address.toLowerCase() !== session.address.toLowerCase()) {
      throw new Error(
        `Smart account address mismatch: computed ${smartAccount.address}, expected ${session.address}`
      );
    }

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

    // Pimlico client
    const pimlicoClient = createPimlicoClient({
      chain: sepolia,
      transport: http(process.env.BUNDLER_URL!),
      entryPoint: { address: entryPoint07Address, version: "0.7" },
    });

    const bundlerClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.BUNDLER_URL!),
    });

    try {
      /* ──────────────────────────────── */
      /* 1. Prepare UserOperation         */
      /* ──────────────────────────────── */

      const { prepareUserOperation } = await import("viem/account-abstraction");
      
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
      console.log("UserOp has factory:", !!userOperation.factory);

      const userOpForSponsorship: any = {
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

      if (userOperation.factory) {
        userOpForSponsorship.factory = userOperation.factory;
        userOpForSponsorship.factoryData = userOperation.factoryData;
      }

      const sponsored = await pimlicoClient.sponsorUserOperation({
        userOperation: userOpForSponsorship,
      });

      console.log("UserOp sponsored by paymaster");

      // Merge sponsored fields
      userOperation = {
        ...userOperation,
        ...sponsored,
      } as typeof userOperation;

      /* ──────────────────────────────── */
      /* 3. Sign with Enclave (offline)   */
      /* ──────────────────────────────── */

      console.log("Sending UserOp to enclave for signing...");
      
      const enclaveResponse = await enclaveClient.signUserOperation({
        sessionAccountId: session.sessionAccountId,
        preparedUserOperation: userOperation,
        proposedTx,
        policyRules,
        signals,
        context: {
          userAddress,
          adapterId: adapter.id,
          lastExecutionTime: lastExecutionTime?.toISOString(),
        },
      });

      if (!enclaveResponse.allowed) {
        return {
          success: false,
          decision: enclaveResponse.decision as "BLOCK" | "ERROR",
          reason: enclaveResponse.reason || "Enclave blocked transaction",
        };
      }

      if (!enclaveResponse.signature) {
        throw new Error("Enclave did not return signature");
      }

      console.log("UserOp signed by enclave");

      const signedUserOperation = {
        ...userOperation,
        signature: enclaveResponse.signature,
      };

      /* ──────────────────────────────── */
      /* 4. Broadcast to Bundler          */
      /* ──────────────────────────────── */

      const { toHex } = await import("viem");
      
      const userOpForBundler: any = {
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

      if (signedUserOperation.factory) {
        userOpForBundler.factory = signedUserOperation.factory;
        userOpForBundler.factoryData = signedUserOperation.factoryData;
        console.log("Including factory fields for deployment");
      }

      const sentUserOpHash = (await bundlerClient.request({
        method: "eth_sendUserOperation" as any,
        params: [userOpForBundler, entryPoint07Address],
      })) as `0x${string}`;

      console.log("UserOp sent to bundler:", sentUserOpHash);

      /* ──────────────────────────────── */
      /* 5. Wait for Receipt              */
      /* ──────────────────────────────── */

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
        console.log(`Polling for receipt... attempt ${attempts}/${maxAttempts}`);
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
