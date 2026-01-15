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

const TimeWindowSchema = z.object({
  days: z.array(z.number().min(0).max(6)).min(1),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
  timezone: z.string(),
}).refine(data => data.endHour > data.startHour);


const RecipientsSchema = z.object({
  allowed: z.array(z.string()).optional(),
}).refine(data => !(data.allowed));



const ConditionsSchema = z.object({
  timeWindow: TimeWindowSchema.optional(),
  recipients: RecipientsSchema.optional(),
});

const LimitsSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  currency: z.string(),
  period: z.enum(["daily", "weekly", "monthly"]),
});

export const PolicyDocumentSchema = z.object({
  version: z.literal("2024-01-01"),
  name: z.string(),
  description: z.string().optional(),
  limits: LimitsSchema,
  conditions: ConditionsSchema.optional(),
});

export function isPolicyDocument(obj: unknown): obj is PolicyDocument {
  try {
    PolicyDocumentSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

export function validatePolicyDocument(obj: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  try {
    PolicyDocumentSchema.parse(obj);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { valid: false, errors: error };
    throw error;
  }
}
