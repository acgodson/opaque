import type { Adapter, ProposedTransaction } from "../adapters/types.js";
export interface Session {
    address: `0x${string}`;
    sessionAccountId: string;
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
    enclaveClient?: ExecutorEnclaveClient;
}
export declare class Executor {
    executeAdapter(input: ExecuteInput): Promise<{
        success: boolean;
        decision: "ALLOW";
        reason: string;
        userOpHash?: undefined;
        txHash?: undefined;
    } | {
        success: boolean;
        decision: "BLOCK" | "ERROR";
        reason: string;
        userOpHash?: undefined;
        txHash?: undefined;
    } | {
        success: boolean;
        decision: "ERROR";
        reason: string;
        userOpHash: `0x${string}`;
        txHash?: undefined;
    } | {
        success: boolean;
        decision: "ALLOW";
        reason: string;
        txHash: any;
        userOpHash: `0x${string}`;
    }>;
}
export declare const executor: Executor;
