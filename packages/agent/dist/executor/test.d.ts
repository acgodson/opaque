import type { Adapter } from "../adapters/types.js";
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
export declare class Executor {
    executeAdapter(input: ExecuteInput): Promise<{
        success: boolean;
        decision: "ALLOW";
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
    } | {
        success: boolean;
        decision: "ERROR";
        reason: string;
        userOpHash?: undefined;
        txHash?: undefined;
    }>;
}
export declare const executor: Executor;
