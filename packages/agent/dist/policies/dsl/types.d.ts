import { z } from "zod";
/**
 * Policy DSL types for building transaction policies.
 */
export interface PolicyDocument {
    version: "2024-01-01";
    name: string;
    description?: string;
    limits: {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    };
    conditions?: {
        timeWindow?: {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        };
        recipients?: {
            allowed?: string[];
        };
    };
}
export interface PrivyPolicy {
    address?: string;
    allowedContracts?: string[];
}
export interface RuleConfig {
    policyType: string;
    isEnabled: boolean;
    config: Record<string, any>;
}
export interface CompiledPolicy {
    valid: boolean;
    policy: PolicyDocument;
    privyPolicy: PrivyPolicy;
    rules: RuleConfig[];
    summary: string;
    errors?: string[];
}
export declare const PolicyDocumentSchema: z.ZodObject<{
    version: z.ZodLiteral<"2024-01-01">;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    limits: z.ZodObject<{
        amount: z.ZodEffects<z.ZodString, string, string>;
        currency: z.ZodString;
        period: z.ZodEnum<["daily", "weekly", "monthly"]>;
    }, "strip", z.ZodTypeAny, {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    }, {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    }>;
    conditions: z.ZodOptional<z.ZodObject<{
        timeWindow: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            days: z.ZodArray<z.ZodNumber, "many">;
            startHour: z.ZodNumber;
            endHour: z.ZodNumber;
            timezone: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        }, {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        }>, {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        }, {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        }>>;
        recipients: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            allowed: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            allowed?: string[] | undefined;
        }, {
            allowed?: string[] | undefined;
        }>, {
            allowed?: string[] | undefined;
        }, {
            allowed?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        timeWindow?: {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
        } | undefined;
    }, {
        timeWindow?: {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: "2024-01-01";
    name: string;
    limits: {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    };
    description?: string | undefined;
    conditions?: {
        timeWindow?: {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
        } | undefined;
    } | undefined;
}, {
    version: "2024-01-01";
    name: string;
    limits: {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    };
    description?: string | undefined;
    conditions?: {
        timeWindow?: {
            days: number[];
            startHour: number;
            endHour: number;
            timezone: string;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
        } | undefined;
    } | undefined;
}>;
export declare function isPolicyDocument(obj: unknown): obj is PolicyDocument;
export declare function validatePolicyDocument(obj: unknown): {
    valid: boolean;
    errors?: z.ZodError;
};
