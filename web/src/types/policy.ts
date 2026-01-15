export interface PolicyDocument {
  version: "2024-01-01";
  name: string;
  description?: string;
  limits: {
    amount: string;
    currency: string;
    period: "daily" | "weekly" | "monthly";
  };
  conditions?: {
    timeWindow?: {
      days: number[];
      startHour: number;
      endHour: number;
      timezone: string;
    };
    signals?: {
      gas?: {
        maxGwei: number;
      };
      security?: {
        maxAlertCount: number;
        blockedSeverities?: string[];
      };
    };
    recipients?: {
      allowed?: string[];
      blocked?: string[];
    };
    cooldown?: {
      seconds: number;
    };
  };
}

export interface MetaMaskPermission {
  type: string;
  data: {
    token: string;
    allowance: string;
    period: number;
    start: number;
    end: number;
  };
}

export interface RuleConfig {
  policyType: string;
  isEnabled: boolean;
  config: Record<string, any>;
}

export interface CompiledPolicy {
  valid: boolean;
  policy: PolicyDocument;
  permission: MetaMaskPermission;
  rules: RuleConfig[];
  summary: string;
  errors?: string[];
}

export interface PolicyFormState {
  version: "2024-01-01";
  name: string;
  description?: string;
  limits: {
    amount: string;
    currency: string;
    period: "daily" | "weekly" | "monthly";
  };
  conditions?: Partial<PolicyDocument["conditions"]>;
}

export interface PolicyValidationError {
  field: string;
  message: string;
  path?: string;
}

export interface TokenOption {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  testnet?: boolean;
}

export interface PeriodOption {
  value: "daily" | "weekly" | "monthly";
  label: string;
  seconds: number;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  policy: PolicyDocument;
}

export const SUPPORTED_TOKENS: TokenOption[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    testnet: true,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    decimals: 6,
    testnet: true,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    decimals: 18,
    testnet: true,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    decimals: 18,
    testnet: true,
  },
];

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "daily", label: "Daily", seconds: 86400 },
  { value: "weekly", label: "Weekly", seconds: 604800 },
  { value: "monthly", label: "Monthly", seconds: 2592000 },
];

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export function createEmptyPolicy(): PolicyFormState {
  return {
    version: "2024-01-01",
    name: "",
    description: "",
    limits: {
      amount: "",
      currency: "USDC",
      period: "daily",
    },
  };
}

export function isPolicyComplete(policy: Partial<PolicyDocument>): boolean {
  return !!(
    policy.version &&
    policy.name &&
    policy.limits?.amount &&
    policy.limits?.currency &&
    policy.limits?.period
  );
}

export function formatAmount(amount: string, decimals: number = 2): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function getTokenBySymbol(symbol: string): TokenOption | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}

export function getPeriodByValue(
  value: "daily" | "weekly" | "monthly"
): PeriodOption | undefined {
  return PERIOD_OPTIONS.find((p) => p.value === value);
}
