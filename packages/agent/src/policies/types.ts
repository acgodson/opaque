import type { ProposedTransaction } from "../adapters/types.js";

export interface PolicyContext {
  userAddress: `0x${string}`;
  adapterId: string;
  proposedTx: ProposedTransaction;
  timestamp: Date;
  lastExecutionTime?: Date;
}

export interface PolicyConfig {
  maxAmount?: {
    enabled: boolean;
    limit: string; // BigInt as string for JSON compatibility
  };
  timeWindow?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  whitelist?: {
    enabled: boolean;
    root?: string;
    path?: string[];
    index?: number;
  };
}

export interface PolicyResult {
  policyType: string;
  policyName: string;
  allowed: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

export interface PolicyRule {
  type: string;
  name: string;
  description: string;
  defaultConfig: Record<string, any>;
  prepareConfig: (
    context: PolicyContext,
    config: Record<string, any>
  ) => Promise<Partial<PolicyConfig>>;
}

export interface EvaluationResult {
  allowed: boolean;
  decisions: PolicyResult[];
  blockingPolicy?: string;
  blockingReason?: string;
}
