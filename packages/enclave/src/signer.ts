import { privateKeyToAccount } from "viem/accounts";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/smart-accounts-kit";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export interface SignTransactionInput {
  privateKey: `0x${string}`;
  smartAccountAddress: `0x${string}`;
  deployParams: [
    owner: `0x${string}`,
    keyIds: string[],
    xValues: bigint[],
    yValues: bigint[]
  ];
  preparedUserOperation: any;
}

export interface SignTransactionOutput {
  signature: `0x${string}`;
}

export async function signTransaction(
  input: SignTransactionInput
): Promise<SignTransactionOutput> {
  const { privateKey, smartAccountAddress, deployParams, preparedUserOperation } = input;

  const signerAccount = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL),
  });

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams,
    deploySalt: "0x",
    signer: { account: signerAccount },
  });

  console.log(`[ENCLAVE] Signing for smart account: ${smartAccount.address}`);
  console.log(`[ENCLAVE] Expected address: ${smartAccountAddress}`);
  console.log(`[ENCLAVE] UserOp sender: ${preparedUserOperation.sender}`);

  if (smartAccount.address.toLowerCase() !== smartAccountAddress.toLowerCase()) {
    throw new Error(
      `Smart account address mismatch!\n` +
      `Computed: ${smartAccount.address}\n` +
      `Expected: ${smartAccountAddress}`
    );
  }

  if (smartAccount.address.toLowerCase() !== preparedUserOperation.sender.toLowerCase()) {
    throw new Error(
      `UserOp sender mismatch!\n` +
      `Smart account: ${smartAccount.address}\n` +
      `UserOp sender: ${preparedUserOperation.sender}`
    );
  }

  const signature = await smartAccount.signUserOperation(
    preparedUserOperation
  );

  console.log(`[ENCLAVE] ✓ Signed successfully`);

  return {
    signature,
  };
}
