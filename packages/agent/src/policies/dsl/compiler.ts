import { parseUnits } from "viem";
import {
  PolicyDocument,
  PolicyDocumentSchema,
  MetaMaskPermission,
  RuleConfig,
  CompiledPolicy,
} from "./types.js";
import { getTokenAddress, getTokenDecimals } from "./tokens.js";

/**
 * PolicyCompiler
 *
 * Compiles user-friendly PolicyDocuments into:
 * 1. MetaMask Advanced Permissions (ERC-7715)
 * 2. opaque Policy Rules
 */
export class PolicyCompiler {
  /**
   * Compile a PolicyDocument
   *
   * @param policyDoc Policy document (will be validated)
   * @returns Compiled policy with permission and rules
   * @throws Error if validation fails
   */
  compile(policyDoc: unknown): CompiledPolicy {
    try {
      // Validate schema
      const policy = PolicyDocumentSchema.parse(policyDoc);

      // Compile to MetaMask permission
      const permission = this.toMetaMaskPermission(policy);

      // Compile to opaque rules
      const rules = this.toVisorRules(policy);

      // Generate human-readable summary
      const summary = this.generateSummary(policy);

      return {
        valid: true,
        policy,
        permission,
        rules,
        summary,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          valid: false,
          policy: policyDoc as PolicyDocument,
          permission: {} as MetaMaskPermission,
          rules: [],
          summary: "",
          errors: [error.message],
        };
      }
      throw error;
    }
  }

  /**
   * Convert PolicyDocument limits to MetaMask Permission
   *
   * Maps the policy limits to MetaMask's erc20-token-periodic permission format
   */
  private toMetaMaskPermission(policy: PolicyDocument): MetaMaskPermission {
    const { limits } = policy;

    // Map period to seconds
    const periodSeconds = this.periodToSeconds(limits.period);

    // Get token info
    const tokenAddress = getTokenAddress(limits.currency);
    const decimals = getTokenDecimals(limits.currency);

    // Convert amount to smallest unit
    const allowance = parseUnits(limits.amount, decimals);

    // Current timestamp
    const now = Math.floor(Date.now() / 1000);

    return {
      type: "erc20-token-periodic",
      data: {
        token: tokenAddress,
        allowance,
        period: periodSeconds,
        start: now,
        end: 0, // No expiration
      },
    };
  }

  /**
   * Convert PolicyDocument conditions to opaque Rules
   *
   * Each condition type maps to one or more policy rules
   */
  private toVisorRules(policy: PolicyDocument): RuleConfig[] {
    const rules: RuleConfig[] = [];

    // Always include max-amount rule from limits
    rules.push({
      policyType: "max-amount",
      isEnabled: true,
      config: {
        maxAmount: policy.limits.amount,
        currency: policy.limits.currency,
      },
    });

    // Optional conditions
    if (policy.conditions) {
      const { timeWindow, signals, recipients, cooldown } = policy.conditions;

      // Time window restriction
      if (timeWindow) {
        rules.push({
          policyType: "time-window",
          isEnabled: true,
          config: {
            days: timeWindow.days,
            startHour: timeWindow.startHour,
            endHour: timeWindow.endHour,
            timezone: timeWindow.timezone,
          },
        });
      }

      // Gas limit
      if (signals?.gas) {
        rules.push({
          policyType: "gas-limit",
          isEnabled: true,
          config: {
            maxGwei: signals.gas.maxGwei,
          },
        });
      }

      // Security monitoring
      if (signals?.security) {
        rules.push({
          policyType: "security-pause",
          isEnabled: true,
          config: {
            maxAlertCount: signals.security.maxAlertCount,
            blockedSeverities: signals.security.blockedSeverities || [],
          },
        });
      }

      // Recipient whitelist/blacklist
      if (recipients) {
        rules.push({
          policyType: "recipient-whitelist",
          isEnabled: true,
          config: {
            allowed: recipients.allowed || [],
            blocked: recipients.blocked || [],
          },
        });
      }

      // Cooldown
      if (cooldown) {
        rules.push({
          policyType: "cooldown",
          isEnabled: true,
          config: {
            minimumSeconds: cooldown.seconds,
          },
        });
      }
    }

    return rules;
  }

  /**
   * Generate human-readable summary of the policy
   */
  private generateSummary(policy: PolicyDocument): string {
    const parts: string[] = [];

    // Core limits
    const { amount, currency, period } = policy.limits;
    parts.push(
      `Transfer up to ${amount} ${currency} every ${this.periodToHuman(period)}`
    );

    // Conditions
    if (policy.conditions) {
      const { timeWindow, signals, recipients, cooldown } = policy.conditions;

      // Time window
      if (timeWindow) {
        const daysStr = this.daysToHuman(timeWindow.days);
        const timeStr = this.timeRangeToHuman(
          timeWindow.startHour,
          timeWindow.endHour
        );
        parts.push(`only ${daysStr}, ${timeStr}`);
      }

      // Gas limit
      if (signals?.gas) {
        parts.push(`only when gas is below ${signals.gas.maxGwei} gwei`);
      }

      // Security monitoring
      if (signals?.security) {
        parts.push(
          `pause if more than ${signals.security.maxAlertCount} security alerts`
        );
      }

      // Recipients
      if (recipients?.allowed && recipients.allowed.length > 0) {
        parts.push(
          `only to ${recipients.allowed.length} whitelisted address${recipients.allowed.length > 1 ? "es" : ""}`
        );
      } else if (recipients?.blocked && recipients.blocked.length > 0) {
        parts.push(
          `excluding ${recipients.blocked.length} blocked address${recipients.blocked.length > 1 ? "es" : ""}`
        );
      }

      // Cooldown
      if (cooldown) {
        parts.push(
          `with ${this.secondsToHuman(cooldown.seconds)} minimum between transactions`
        );
      }
    }

    // Capitalize first letter and add period
    let summary = parts.join(", ");
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    if (!summary.endsWith(".")) {
      summary += ".";
    }

    return summary;
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Convert period string to seconds
   */
  private periodToSeconds(period: "daily" | "weekly" | "monthly"): number {
    const map = {
      daily: 86400, // 24 hours
      weekly: 604800, // 7 days
      monthly: 2592000, // 30 days
    };
    return map[period];
  }

  /**
   * Convert period to human-readable string
   */
  private periodToHuman(period: "daily" | "weekly" | "monthly"): string {
    const map = {
      daily: "day",
      weekly: "week",
      monthly: "month",
    };
    return map[period];
  }

  /**
   * Convert day numbers to human-readable string
   */
  private daysToHuman(days: number[]): string {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const sortedDays = [...days].sort();
    const names = sortedDays.map((d) => dayNames[d]);

    // Check for weekdays (Mon-Fri)
    if (
      sortedDays.length === 5 &&
      sortedDays.every((d, i) => d === i + 1)
    ) {
      return "on weekdays";
    }

    // Check for weekends
    if (sortedDays.length === 2 && sortedDays[0] === 0 && sortedDays[1] === 6) {
      return "on weekends";
    }

    // Check for every day
    if (sortedDays.length === 7) {
      return "every day";
    }

    // List specific days
    if (names.length === 1) {
      return `on ${names[0]}`;
    } else if (names.length === 2) {
      return `on ${names[0]} and ${names[1]}`;
    } else {
      const last = names.pop();
      return `on ${names.join(", ")}, and ${last}`;
    }
  }

  /**
   * Convert time range to human-readable string
   */
  private timeRangeToHuman(startHour: number, endHour: number): string {
    const formatHour = (hour: number): string => {
      if (hour === 0) return "12am";
      if (hour === 12) return "12pm";
      if (hour < 12) return `${hour}am`;
      return `${hour - 12}pm`;
    };

    return `${formatHour(startHour)}-${formatHour(endHour)}`;
  }

  /**
   * Convert seconds to human-readable string
   */
  private secondsToHuman(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  }
}

/**
 * Singleton compiler instance
 */
export const policyCompiler = new PolicyCompiler();
