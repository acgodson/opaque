import { generatePrivateKey } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export interface EnclaveClient {
  provisionKey(request: {
    sessionAccountId: string;
    privateKey: `0x${string}`;
    userAddress: `0x${string}`;
    adapterId: string;
    deployParams: [
      owner: `0x${string}`,
      keyIds: string[],
      xValues: bigint[],
      yValues: bigint[]
    ];
  }): Promise<{
    success: boolean;
    sessionAccountAddress: `0x${string}`;
  }>;
}

export interface SessionAccount {
  sessionAccountId: string;
  smartAccountAddress: `0x${string}`;
  userAddress: `0x${string}`;
  adapterId: string;
  deployParams: [
    owner: `0x${string}`,
    keyIds: string[],
    xValues: bigint[],
    yValues: bigint[]
  ];
}

class SessionManager {
  private publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL),
  });

  async createSession(
    userAddress: `0x${string}`,
    adapterId: string,
    enclaveClient: EnclaveClient
  ): Promise<SessionAccount> {
    const normalizedUser = userAddress.toLowerCase() as `0x${string}`;

    const sessionAccountId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const privateKey = generatePrivateKey();
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(privateKey);

    const deployParams: [owner: `0x${string}`, keyIds: string[], xValues: bigint[], yValues: bigint[]] = [account.address, [], [], []];

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
