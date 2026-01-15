import { createWalletClient, createPublicClient, http, type Address, type Hash, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantleSepoliaTestnet } from "viem/chains";

export class OpaqueWalletClient {
    private walletClient: ReturnType<typeof createWalletClient>;
    private publicClient: ReturnType<typeof createPublicClient>;
    private account: ReturnType<typeof privateKeyToAccount>;

    constructor(privateKey: string) {
        // Ensure private key has 0x prefix
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.account = privateKeyToAccount(formattedKey as `0x${string}`);
        
        this.walletClient = createWalletClient({
            account: this.account,
            chain: mantleSepoliaTestnet,
            transport: http()
        });

        this.publicClient = createPublicClient({
            chain: mantleSepoliaTestnet,
            transport: http()
        });
    }

    async initialize(): Promise<void> {
        console.log(`[WalletClient] Initialized with address: ${this.account.address}`);
    }

    getAddress(): Address {
        return this.account.address;
    }

    async getBalance(): Promise<bigint> {
        const balance = await this.publicClient.getBalance({
            address: this.account.address
        });

        console.log(`[WalletClient] Balance: ${formatEther(balance)} MNT`);
        return balance;
    }

    async signTransaction(tx: {
        to: Address;
        data: `0x${string}`;
        value?: bigint;
    }): Promise<Hash> {
        console.log(`[WalletClient] Sending transaction...`);
        console.log(`   From: ${this.account.address}`);
        console.log(`   To: ${tx.to}`);
        console.log(`   Value: ${tx.value || 0n}`);
        console.log(`   Data length: ${tx.data.length} bytes`);

        const txHash = await this.walletClient.sendTransaction({
            to: tx.to,
            data: tx.data,
            value: tx.value || 0n
        } as any);

        console.log(`[WalletClient] Transaction sent: ${txHash}`);
        return txHash;
    }

    async verifyWallet(): Promise<boolean> {
        try {
            const balance = await this.getBalance();
            return balance >= 0n;
        } catch (error) {
            console.error("[WalletClient] Wallet verification failed:", error);
            return false;
        }
    }
}
