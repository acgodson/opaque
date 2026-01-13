import { CompiledPolicy } from "./types.js";
/**
 * PolicyCompiler
 *
 * Compiles user-friendly PolicyDocuments into:
 * 1. MetaMask Advanced Permissions (ERC-7715)
 * 2. opaque Policy Rules
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
    /**
     * Convert PolicyDocument limits to MetaMask Permission
     *
     * Maps the policy limits to MetaMask's erc20-token-periodic permission format
     */
    private toMetaMaskPermission;
    /**
     * Convert PolicyDocument conditions to opaque Rules
     *
     * Each condition type maps to one or more policy rules
     */
    private toVisorRules;
    /**
     * Generate human-readable summary of the policy
     */
    private generateSummary;
    /**
     * Convert period string to seconds
     */
    private periodToSeconds;
    /**
     * Convert period to human-readable string
     */
    private periodToHuman;
    /**
     * Convert day numbers to human-readable string
     */
    private daysToHuman;
    /**
     * Convert time range to human-readable string
     */
    private timeRangeToHuman;
    /**
     * Convert seconds to human-readable string
     */
    private secondsToHuman;
}
/**
 * Singleton compiler instance
 */
export declare const policyCompiler: PolicyCompiler;
