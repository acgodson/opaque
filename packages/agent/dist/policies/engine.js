import { fetchAllSignals } from "../signals/index.js";
import { gasLimitRule } from "./rules/gas-limit.js";
import { timeWindowRule } from "./rules/time-window.js";
import { maxAmountRule } from "./rules/max-amount.js";
import { securityPauseRule } from "./rules/security-pause.js";
import { recipientWhitelistRule } from "./rules/recipient-whitelist.js";
import { cooldownRule } from "./rules/cooldown.js";
const policyRules = new Map([
    ["gas-limit", gasLimitRule],
    ["time-window", timeWindowRule],
    ["max-amount", maxAmountRule],
    ["security-pause", securityPauseRule],
    ["recipient-whitelist", recipientWhitelistRule],
    ["cooldown", cooldownRule],
]);
export function getAllPolicyRules() {
    return Array.from(policyRules.values());
}
export function getPolicyRule(type) {
    return policyRules.get(type);
}
class PolicyEngine {
    async evaluate(userAddress, adapterId, proposedTx, options) {
        const policies = await this.getUserPolicies(userAddress, adapterId, options.db);
        const signals = await fetchAllSignals();
        const context = {
            userAddress,
            adapterId,
            proposedTx,
            signals,
            timestamp: new Date(),
            lastExecutionTime: options.lastExecutionTime,
        };
        const decisions = [];
        for (const policy of policies) {
            if (!policy.isEnabled)
                continue;
            const rule = policyRules.get(policy.policyType);
            if (!rule) {
                console.warn(`Unknown policy type: ${policy.policyType}`);
                continue;
            }
            // Handle both JSONB (already parsed object) and JSON string formats
            const config = typeof policy.config === 'string'
                ? JSON.parse(policy.config)
                : policy.config;
            const result = await rule.evaluate(context, config);
            decisions.push(result);
            console.log(`Policy ${policy.policyType}: ${result.allowed ? "ALLOW" : "BLOCK"} - ${result.reason}`);
            if (!result.allowed) {
                return {
                    allowed: false,
                    decisions,
                    blockingPolicy: policy.policyType,
                    blockingReason: result.reason,
                };
            }
        }
        return { allowed: true, decisions };
    }
    async getUserPolicies(userAddress, adapterId, db) {
        const normalizedAddress = userAddress.toLowerCase();
        const allPolicies = await db.query.userPolicies.findMany({
            where: (userPolicies, { eq, and, or, isNull }) => and(eq(userPolicies.userAddress, normalizedAddress), or(isNull(userPolicies.adapterId), eq(userPolicies.adapterId, adapterId)))
        });
        return allPolicies;
    }
}
export const policyEngine = new PolicyEngine();
