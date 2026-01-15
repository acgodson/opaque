import { CompiledPolicy } from "./types.js";
/**
 * PolicyCompiler
 *
 * Compiles user-friendly PolicyDocuments into:
 * 1. Privy Server Wallet Policy
 * 2. Opaque ZK Policy Rules
 */
export declare class PolicyCompiler {
    /**
     * Compile a PolicyDocument
     *
     * @param policyDoc Policy document (will be validated)
     * @returns Compiled policy with permission and rules
     * @throws Error if validation fails
     */
    compile(policyDoc: unknown): CompiledPolicy;
    private toPrivyPolicy;
    private toEnclaveRules;
    private generateSummary;
}
export declare const policyCompiler: PolicyCompiler;
