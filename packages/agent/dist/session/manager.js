import { generatePrivateKey } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
class SessionManager {
    publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.RPC_URL),
    });
    async createSession(userAddress, adapterId, enclaveClient) {
        const normalizedUser = userAddress.toLowerCase();
        const sessionAccountId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const privateKey = generatePrivateKey();
        const { privateKeyToAccount } = await import("viem/accounts");
        const account = privateKeyToAccount(privateKey);
        const deployParams = [account.address, [], [], []];
        const result = await enclaveClient.provisionKey({
            sessionAccountId,
            privateKey,
            userAddress: normalizedUser,
            adapterId,
            deployParams,
        });
        return {
            sessionAccountId,
            smartAccountAddress: result.sessionAccountAddress,
            userAddress: normalizedUser,
            adapterId,
            deployParams,
        };
    }
    getPublicClient() {
        return this.publicClient;
    }
}
export const sessionManager = new SessionManager();
