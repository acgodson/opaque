export interface PolicyFormState {
  name: string;
  description?: string;
  maxAmount: {
    enabled: boolean;
    limit: string;
  };
  timeWindow?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  whitelist?: {
    enabled: boolean;
    addresses: string[];
  };
}

export interface CompiledPolicy {
  valid: boolean;
  config: PolicyConfig;
  summary: string;
  errors?: string[];
}

export interface PolicyConfig {
  maxAmount?: {
    enabled: boolean;
    limit: string;
  };
  timeWindow?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  whitelist?: {
    enabled: boolean;
    addresses?: string[]; // UI sends addresses
    root?: string;        // Backend generates root
    path?: string[];      // Backend generates path
    index?: number;       // Backend generates index
  };
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  policy: PolicyFormState;
}

export function createEmptyPolicy(): PolicyFormState {
  return {
    name: "",
    description: "",
    maxAmount: {
      enabled: false,
      limit: "100",
    },
  };
}
