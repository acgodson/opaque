import type { PolicyConfig, TransactionData, ProofResult } from "./proof-generator.js";

export interface StoredPolicyConfig {
    userAddress: string;
    installationId: number;
    policyConfig: PolicyConfig;
    createdAt: Date;
}

class PolicyStore {
    private policies = new Map<string, StoredPolicyConfig>();

    private getKey(userAddress: string, installationId: number): string {
        return `${userAddress.toLowerCase()}:${installationId}`;
    }

    store(userAddress: string, installationId: number, policyConfig: PolicyConfig): void {
        const key = this.getKey(userAddress, installationId);
        this.policies.set(key, {
            userAddress,
            installationId,
            policyConfig,
            createdAt: new Date(),
        });
        console.log(`✓ Stored policy config for ${userAddress}:${installationId}`);
    }

    get(userAddress: string, installationId: number): PolicyConfig | undefined {
        const key = this.getKey(userAddress, installationId);
        return this.policies.get(key)?.policyConfig;
    }

    remove(userAddress: string, installationId: number): boolean {
        const key = this.getKey(userAddress, installationId);
        const deleted = this.policies.delete(key);
        if (deleted) {
            console.log(`✓ Removed policy config for ${userAddress}:${installationId}`);
        }
        return deleted;
    }

    getPolicyCount(): number {
        return this.policies.size;
    }
}

export const policyStore = new PolicyStore();
