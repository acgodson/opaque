import { z } from "zod";
import type { Adapter } from "./types.js";
declare const configSchema: z.ZodObject<{
    tokenType: z.ZodDefault<z.ZodEnum<["USDC", "ETH"]>>;
    tokenAddress: z.ZodOptional<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
    amountPerTransfer: z.ZodDefault<z.ZodString>;
    maxAmountPerPeriod: z.ZodDefault<z.ZodString>;
    period: z.ZodDefault<z.ZodEnum<["daily", "weekly", "monthly"]>>;
    decimals: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    period: "daily" | "weekly" | "monthly";
    tokenType: "USDC" | "ETH";
    amountPerTransfer: string;
    maxAmountPerPeriod: string;
    recipient?: string | undefined;
    decimals?: number | undefined;
    tokenAddress?: string | undefined;
}, {
    period?: "daily" | "weekly" | "monthly" | undefined;
    recipient?: string | undefined;
    decimals?: number | undefined;
    tokenAddress?: string | undefined;
    tokenType?: "USDC" | "ETH" | undefined;
    amountPerTransfer?: string | undefined;
    maxAmountPerPeriod?: string | undefined;
}>;
export type TransferBotConfig = z.infer<typeof configSchema>;
export declare const transferBotAdapter: Adapter;
export {};
