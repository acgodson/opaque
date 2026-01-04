import type { PolicyContext, PolicyResult, EvaluationResult } from "@0xvisor/agent";
import {
  gasLimitRule,
  timeWindowRule,
  maxAmountRule,
  securityPauseRule,
  recipientWhitelistRule,
  cooldownRule,
} from "@0xvisor/agent";

const policyRules = new Map([
  ["gas-limit", gasLimitRule],
  ["time-window", timeWindowRule],
  ["max-amount", maxAmountRule],
  ["security-pause", securityPauseRule],
  ["recipient-whitelist", recipientWhitelistRule],
  ["cooldown", cooldownRule],
]);

export async function evaluatePolicies(
  userAddress: `0x${string}`,
  adapterId: string,
  proposedTx: any,
  options: {
    policyRules: any[];
    signals: any;
    lastExecutionTime?: Date;
  }
): Promise<EvaluationResult> {
  const { policyRules: rules, signals, lastExecutionTime } = options;

  const context: PolicyContext = {
    userAddress,
    adapterId,
    proposedTx,
    signals,
    timestamp: new Date(),
    lastExecutionTime,
  };

  const decisions: PolicyResult[] = [];

  for (const policyConfig of rules) {
    if (!policyConfig.isEnabled) continue;

    const rule = policyRules.get(policyConfig.policyType);
    if (!rule) {
      console.warn(`Unknown policy type: ${policyConfig.policyType}`);
      continue;
    }

    const result = await rule.evaluate(context, policyConfig.config);
    decisions.push(result);

    console.log(
      `Policy ${policyConfig.policyType}: ${result.allowed ? "ALLOW" : "BLOCK"} - ${result.reason}`
    );

    if (!result.allowed) {
      return {
        allowed: false,
        decisions,
        blockingPolicy: policyConfig.policyType,
        blockingReason: result.reason,
      };
    }
  }

  return { allowed: true, decisions };
}
