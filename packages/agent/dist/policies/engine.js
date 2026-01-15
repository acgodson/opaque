import { timeWindowRule } from "./rules/time-window.js";
import { maxAmountRule } from "./rules/max-amount.js";
import { recipientWhitelistRule } from "./rules/recipient-whitelist.js";
const policyRules = new Map([
    ["time-window", timeWindowRule],
    ["max-amount", maxAmountRule],
    ["recipient-whitelist", recipientWhitelistRule],
]);
export function getAllPolicyRules() {
    return Array.from(policyRules.values());
}
export function getPolicyRule(type) {
    return policyRules.get(type);
}
class PolicyEngine {
    async prepareConfig(userAddress, adapterId, proposedTx, options) {
        const policies = await this.getUserPolicies(userAddress, adapterId, options.db);
        const context = {
            userAddress,
            adapterId,
            proposedTx,
            timestamp: new Date(),
            lastExecutionTime: options.lastExecutionTime,
        };
        const aggregatedConfig = {};
        for (const policy of policies) {
            if (!policy.isEnabled)
                continue;
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
    async getUserPolicies(userAddress, adapterId, db) {
        const normalizedAddress = userAddress.toLowerCase();
        const allPolicies = await db.query.userPolicies.findMany({
            where: (userPolicies, { eq, and, or, isNull }) => and(eq(userPolicies.userAddress, normalizedAddress), or(isNull(userPolicies.adapterId), eq(userPolicies.adapterId, adapterId)))
        });
        return allPolicies;
    }
}
export const policyEngine = new PolicyEngine();
