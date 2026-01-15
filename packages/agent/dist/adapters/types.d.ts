import { z } from "zod";
export interface AdapterContext {
    userAddress: `0x${string}`;
    config: Record<string, any>;
    runtimeParams?: {
        recipient?: `0x${string}`;
        [key: string]: any;
    };
}
export interface ProposedTransaction {
    target: `0x${string}`;
    value: bigint;
    callData: `0x${string}`;
    description: string;
    tokenAddress?: string;
    tokenAmount?: bigint;
    recipient?: string;
}
export interface TriggerConfig {
    type: "cron" | "manual";
    schedule?: string;
}
export interface AdapterMetadata {
    id: string;
    name: string;
    description: string;
    icon: string;
    version: string;
    author: string;
    requiredPermissions: string[];
}
export interface Adapter extends AdapterMetadata {
    triggers: TriggerConfig[];
    configSchema: z.ZodSchema;
    proposeTransaction: (context: AdapterContext) => Promise<ProposedTransaction | null>;
    validateConfig: (config: unknown) => boolean;
    getSchedule?: (frequency: string) => string;
}
