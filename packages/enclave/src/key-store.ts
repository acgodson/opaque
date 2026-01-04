import { privateKeyToAccount } from "viem/accounts";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export interface StoredKey {
  privateKey: `0x${string}`;
  smartAccountAddress: `0x${string}`;
  userAddress: `0x${string}`;
  adapterId: string;
  deployParams: any;
}

class KeyStore {
  private keys = new Map<string, StoredKey>();

  async provision(
    sessionAccountId: string,
    privateKey: `0x${string}`,
    userAddress: `0x${string}`,
    adapterId: string,
    deployParams: any
  ): Promise<{ address: `0x${string}` }> {
    if (this.keys.has(sessionAccountId)) {
      throw new Error(`Key already provisioned for session ${sessionAccountId}`);
    }

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

    this.keys.set(sessionAccountId, {
      privateKey,
      smartAccountAddress: smartAccount.address,
      userAddress,
      adapterId,
      deployParams,
    });

    console.log(`✓ Provisioned key for session ${sessionAccountId}`);
    console.log(`  EOA (signer): ${signerAccount.address}`);
    console.log(`  Smart Account: ${smartAccount.address}`);
    console.log(`  Owner in deployParams: ${deployParams[0]}`);

    return { address: smartAccount.address };
  }

  getKey(sessionAccountId: string): StoredKey | undefined {
    return this.keys.get(sessionAccountId);
  }

  revoke(sessionAccountId: string): boolean {
    const deleted = this.keys.delete(sessionAccountId);
    if (deleted) {
      console.log(`✓ Revoked key for session ${sessionAccountId}`);
    }
    return deleted;
  }

  getKeyCount(): number {
    return this.keys.size;
  }
}

export const keyStore = new KeyStore();
