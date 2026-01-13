import { z } from "zod";
/**
 * Policy DSL - Domain-Specific Language for building transaction policies
 *
 * This provides a user-friendly, declarative format for defining policies
 * that compile to both MetaMask Advanced Permissions and opaque policy rules.
 */
/**
 * PolicyDocument - The main DSL format for defining policies
 *
 * This is what users build in the UI. It compiles to:
 * 1. MetaMask Permission (for ERC-7715 delegation)
 * 2. opaque Policy Rules (for transaction validation)
 */
export interface PolicyDocument {
    /** Schema version for future evolution */
    version: "2024-01-01";
    /** Human-readable policy name */
    name: string;
    /** Optional description */
    description?: string;
    /** Core spending limits (REQUIRED) */
    limits: {
        /** Amount as string to avoid floating point issues, e.g., "100" */
        amount: string;
        /** Token symbol, e.g., "USDC" */
        currency: string;
        /** Time period for the limit */
        period: "daily" | "weekly" | "monthly";
    };
    /** Optional safety conditions (all use AND logic) */
    conditions?: {
        /** Time-based restrictions */
        timeWindow?: {
            /** Days of week: 0=Sunday, 6=Saturday */
            days: number[];
            /** Start hour in 24h format (0-23) */
            startHour: number;
            /** End hour in 24h format (0-23) */
            endHour: number;
            /** IANA timezone, e.g., "America/New_York" */
            timezone: string;
        };
        /** Signal-based conditions */
        signals?: {
            /** Gas price monitoring */
            gas?: {
                /** Maximum gas price in gwei */
                maxGwei: number;
            };
            /** Security alert monitoring */
            security?: {
                /** Maximum number of security alerts */
                maxAlertCount: number;
                /** Blocked severity levels, e.g., ["critical", "high"] */
                blockedSeverities?: string[];
            };
        };
        /** Recipient restrictions */
        recipients?: {
            /** Whitelist of allowed addresses */
            allowed?: string[];
            /** Blacklist of blocked addresses */
            blocked?: string[];
        };
        /** Rate limiting */
        cooldown?: {
            /** Minimum seconds between transactions */
            seconds: number;
        };
    };
}
/**
 * MetaMask Permission structure for ERC-7715
 */
export interface MetaMaskPermission {
    /** Permission type */
    type: string;
    /** Permission-specific data */
    data: {
        /** Token contract address */
        token: `0x${string}`;
        /** Allowance amount in token's smallest unit */
        allowance: bigint;
        /** Period duration in seconds */
        period: number;
        /** Start timestamp (Unix seconds) */
        start: number;
        /** End timestamp (0 = no expiration) */
        end: number;
    };
}
/**
 * opaque Rule Configuration
 */
export interface RuleConfig {
    /** Rule type identifier */
    policyType: string;
    /** Whether this rule is enabled */
    isEnabled: boolean;
    /** Rule-specific configuration */
    config: Record<string, any>;
}
/**
 * Compiled policy output
 */
export interface CompiledPolicy {
    /** Whether compilation succeeded */
    valid: boolean;
    /** Original policy document */
    policy: PolicyDocument;
    /** Derived MetaMask permission */
    permission: MetaMaskPermission;
    /** Derived opaque rules */
    rules: RuleConfig[];
    /** Human-readable summary */
    summary: string;
    /** Compilation errors (if any) */
    errors?: string[];
}
/**
 * Main PolicyDocument schema
 */
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
            days: z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, number[], number[]>;
            startHour: z.ZodNumber;
            endHour: z.ZodNumber;
            timezone: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        }, {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        }>, {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        }, {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        }>>;
        signals: z.ZodOptional<z.ZodObject<{
            gas: z.ZodOptional<z.ZodObject<{
                maxGwei: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                maxGwei: number;
            }, {
                maxGwei: number;
            }>>;
            security: z.ZodOptional<z.ZodObject<{
                maxAlertCount: z.ZodNumber;
                blockedSeverities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            }, {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        }, {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        }>>;
        recipients: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            allowed: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            blocked: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        }, {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        }>, {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        }, {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        }>>;
        cooldown: z.ZodOptional<z.ZodObject<{
            seconds: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            seconds: number;
        }, {
            seconds: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        cooldown?: {
            seconds: number;
        } | undefined;
        timeWindow?: {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        } | undefined;
        signals?: {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        } | undefined;
    }, {
        cooldown?: {
            seconds: number;
        } | undefined;
        timeWindow?: {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        } | undefined;
        signals?: {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: "2024-01-01";
    limits: {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    };
    description?: string | undefined;
    conditions?: {
        cooldown?: {
            seconds: number;
        } | undefined;
        timeWindow?: {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        } | undefined;
        signals?: {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        } | undefined;
    } | undefined;
}, {
    name: string;
    version: "2024-01-01";
    limits: {
        amount: string;
        currency: string;
        period: "daily" | "weekly" | "monthly";
    };
    description?: string | undefined;
    conditions?: {
        cooldown?: {
            seconds: number;
        } | undefined;
        timeWindow?: {
            startHour: number;
            endHour: number;
            timezone: string;
            days: number[];
        } | undefined;
        signals?: {
            gas?: {
                maxGwei: number;
            } | undefined;
            security?: {
                maxAlertCount: number;
                blockedSeverities?: string[] | undefined;
            } | undefined;
        } | undefined;
        recipients?: {
            allowed?: string[] | undefined;
            blocked?: string[] | undefined;
        } | undefined;
    } | undefined;
}>;
/**
 * Type guard to check if an object is a valid PolicyDocument
 */
export declare function isPolicyDocument(obj: unknown): obj is PolicyDocument;
/**
 * Validate a PolicyDocument and return detailed errors
 */
export declare function validatePolicyDocument(obj: unknown): {
    valid: boolean;
    errors?: z.ZodError;
};
