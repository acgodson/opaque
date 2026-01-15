import type { ProposedTransaction } from "../adapters/types.js";
import type {
  PolicyRule,
  PolicyContext,
  PolicyConfig,
} from "./types.js";
import { timeWindowRule } from "./rules/time-window.js";
import { maxAmountRule } from "./rules/max-amount.js";
import { recipientWhitelistRule } from "./rules/recipient-whitelist.js";

const policyRules = new Map<string, PolicyRule>([
  ["time-window", timeWindowRule],
  ["max-amount", maxAmountRule],
  ["recipient-whitelist", recipientWhitelistRule],
]);

export function getAllPolicyRules(): PolicyRule[] {
  return Array.from(policyRules.values());
}

export function getPolicyRule(type: string): PolicyRule | undefined {
  return policyRules.get(type);
}

class PolicyEngine {
  async prepareConfig(
    userAddress: `0x${string}`,
    adapterId: string,
    proposedTx: ProposedTransaction,
    options: {
      db: any;
      lastExecutionTime?: Date;
    }
  ): Promise<PolicyConfig> {
    const policies = await this.getUserPolicies(userAddress, adapterId, options.db);

    const context: PolicyContext = {
      userAddress,
      adapterId,
      proposedTx,
      timestamp: new Date(),
      lastExecutionTime: options.lastExecutionTime,
    };

    const aggregatedConfig: PolicyConfig = {};

    for (const policy of policies) {
      if (!policy.isEnabled) continue;

      const rule = policyRules.get(policy.policyType);
      if (!rule) {
        console.warn(`Unknown policy type: ${policy.policyType}`);
        continue;
      }

      const config = typeof policy.config === 'string'
        ? JSON.parse(policy.config)
        : policy.config;

      const ruleConfig = await rule.prepareConfig(context, config);
      Object.assign(aggregatedConfig, ruleConfig);
    }

    return aggregatedConfig;
  }

  private async getUserPolicies(userAddress: string, adapterId: string, db: any) {
    const normalizedAddress = userAddress.toLowerCase();

    const allPolicies = await db.query.userPolicies.findMany({
      where: (userPolicies: any, { eq, and, or, isNull }: any) =>
        and(
          eq(userPolicies.userAddress, normalizedAddress),
          or(
            isNull(userPolicies.adapterId),
            eq(userPolicies.adapterId, adapterId)
          )
        )
    });

    return allPolicies;
  }
}

export const policyEngine = new PolicyEngine();
