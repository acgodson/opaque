import { z } from "zod";
import type { Adapter } from "./types.js";
declare const configSchema: z.ZodObject<{
    tokenAddress: z.ZodDefault<z.ZodString>;
    recipient: z.ZodString;
    amount: z.ZodDefault<z.ZodString>;
    decimals: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    amount: string;
    recipient: string;
    decimals: number;
    tokenAddress: string;
}, {
    recipient: string;
    amount?: string | undefined;
    decimals?: number | undefined;
    tokenAddress?: string | undefined;
}>;
export type MantleTransferConfig = z.infer<typeof configSchema>;
export declare const mantleTransferAdapter: Adapter;
export {};
