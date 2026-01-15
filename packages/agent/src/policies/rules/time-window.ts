import type { PolicyRule, PolicyContext, PolicyConfig } from "../types.js";

export const timeWindowRule: PolicyRule = {
  type: "time-window",
  name: "Time Window",
  description: "Only allow transactions during specific hours (UTC)",
  defaultConfig: {
    startHour: 9,
    endHour: 17,
  },

  async prepareConfig(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<Partial<PolicyConfig>> {
    const {
      startHour = 9,
      endHour = 17,
    } = config;

    return {
      timeWindow: {
        enabled: true,
        startHour,
        endHour,
      },
    };
  },
};
