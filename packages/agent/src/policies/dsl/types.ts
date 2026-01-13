import { z } from "zod";

/**
 * Policy DSL - Domain-Specific Language for building transaction policies
 *
 * This provides a user-friendly, declarative format for defining policies
 * that compile to both MetaMask Advanced Permissions and opaque policy rules.
 */

// ============================================================================
// Core Types
// ============================================================================

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

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Schema for time window condition
 */
const TimeWindowSchema = z.object({
  days: z
    .array(z.number().min(0).max(6))
    .min(1, "At least one day must be selected")
    .refine(
      (days) => new Set(days).size === days.length,
      "Duplicate days are not allowed"
    ),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
  timezone: z.string().min(1, "Timezone is required"),
}).refine(
  (data) => data.endHour > data.startHour,
  "End hour must be after start hour"
);

/**
 * Schema for gas signal condition
 */
const GasSignalSchema = z.object({
  maxGwei: z.number().positive("Gas limit must be positive"),
});

/**
 * Schema for security signal condition
 */
const SecuritySignalSchema = z.object({
  maxAlertCount: z.number().min(0, "Alert count cannot be negative"),
  blockedSeverities: z.array(z.string()).optional(),
});

/**
 * Schema for signals condition
 */
const SignalsSchema = z.object({
  gas: GasSignalSchema.optional(),
  security: SecuritySignalSchema.optional(),
});

/**
 * Schema for recipient restrictions
 */
const RecipientsSchema = z.object({
  allowed: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")).optional(),
  blocked: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")).optional(),
}).refine(
  (data) => !(data.allowed && data.blocked),
  "Cannot have both allowed and blocked lists"
);

/**
 * Schema for cooldown condition
 */
const CooldownSchema = z.object({
  seconds: z.number().positive("Cooldown must be positive"),
});

/**
 * Schema for conditions
 */
const ConditionsSchema = z.object({
  timeWindow: TimeWindowSchema.optional(),
  signals: SignalsSchema.optional(),
  recipients: RecipientsSchema.optional(),
  cooldown: CooldownSchema.optional(),
});

/**
 * Schema for limits
 */
const LimitsSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Amount must be a positive number"
    ),
  currency: z.string().min(1, "Currency is required"),
  period: z.enum(["daily", "weekly", "monthly"]),
});

/**
 * Main PolicyDocument schema
 */
export const PolicyDocumentSchema = z.object({
  version: z.literal("2024-01-01"),
  name: z.string().min(1, "Policy name is required").max(100, "Policy name too long"),
  description: z.string().max(500, "Description too long").optional(),
  limits: LimitsSchema,
  conditions: ConditionsSchema.optional(),
});

/**
 * Type guard to check if an object is a valid PolicyDocument
 */
export function isPolicyDocument(obj: unknown): obj is PolicyDocument {
  try {
    PolicyDocumentSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a PolicyDocument and return detailed errors
 */
export function validatePolicyDocument(obj: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  try {
    PolicyDocumentSchema.parse(obj);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}
