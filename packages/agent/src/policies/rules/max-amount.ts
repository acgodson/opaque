import { formatUnits } from "viem";
import type { PolicyRule, PolicyContext, PolicyConfig } from "../types.js";

export const maxAmountRule: PolicyRule = {
  type: "max-amount",
  name: "Max Transaction Amount",
  description: "Limit the maximum amount per transaction",
  defaultConfig: { maxAmount: 100, decimals: 6 },

  async prepareConfig(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<Partial<PolicyConfig>> {
    const { maxAmount = 100, decimals = 6 } = config;

    // Convert human-readable amount to base units
    const limit = BigInt(maxAmount * (10 ** decimals)).toString();

    return {
      maxAmount: {
        enabled: true,
        limit,
      },
    };
  },
};
