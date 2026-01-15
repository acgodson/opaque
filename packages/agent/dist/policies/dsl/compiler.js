import { PolicyDocumentSchema, } from "./types.js";
const OPAQUE_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_OPAQUE_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000";
/**
 * PolicyCompiler
 *
 * Compiles user-friendly PolicyDocuments into:
 * 1. Privy Server Wallet Policy
 * 2. Opaque ZK Policy Rules
 */
export class PolicyCompiler {
    /**
     * Compile a PolicyDocument
     *
     * @param policyDoc Policy document (will be validated)
     * @returns Compiled policy with permission and rules
     * @throws Error if validation fails
     */
    compile(policyDoc) {
        try {
            const policy = PolicyDocumentSchema.parse(policyDoc);
            const privyPolicy = this.toPrivyPolicy(policy);
            const rules = this.toEnclaveRules(policy);
            const summary = this.generateSummary(policy);
            return {
                valid: true,
                policy,
                privyPolicy,
                rules,
                summary,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                return {
                    valid: false,
                    policy: policyDoc,
                    privyPolicy: {},
                    rules: [],
                    summary: "",
                    errors: [error.message],
                };
            }
            throw error;
        }
    }
    toPrivyPolicy(policy) {
        // Privy server policy: restrict agent to only call OpaqueVerifier
        return {
            allowedContracts: [OPAQUE_VERIFIER_ADDRESS],
        };
    }
    toEnclaveRules(policy) {
        const rules = [];
        // Max amount rule
        rules.push({
            policyType: "max-amount",
            isEnabled: true,
            config: {
                maxAmount: policy.limits.amount,
                currency: policy.limits.currency,
            },
        });
        if (policy.conditions) {
            const { timeWindow, recipients, } = policy.conditions;
            if (timeWindow) {
                rules.push({
                    policyType: "time-window",
                    isEnabled: true,
                    config: {
                        startHour: timeWindow.startHour,
                        endHour: timeWindow.endHour,
                    },
                });
            }
            if (recipients) {
                rules.push({
                    policyType: "recipient-whitelist",
                    isEnabled: true,
                    config: {
                        allowed: recipients.allowed || [],
                    },
                });
            }
        }
        return rules;
    }
    generateSummary(policy) {
        const { amount, currency, period } = policy.limits;
        let summary = `Transfer up to ${amount} ${currency} every ${period}`;
        if (policy.conditions) {
            const { timeWindow, recipients } = policy.conditions;
            if (timeWindow) {
                summary += `, strictly during ${timeWindow.startHour}:00-${timeWindow.endHour}:00 UTC`;
            }
            if (recipients?.allowed?.length) {
                summary += `, only to whitelisted addresses`;
            }
        }
        return summary + ".";
    }
}
export const policyCompiler = new PolicyCompiler();
