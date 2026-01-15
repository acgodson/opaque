import type { PolicyDocument } from "./types.js";

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  policy: PolicyDocument;
}

const policyDocuments: PolicyDocument[] = [
  {
    version: "2024-01-01",
    name: "Conservative Transfer",
    description: "Low limit daily transfers restricted to business hours",
    limits: {
      amount: "50",
      currency: "USDC",
      period: "daily",
    },
    conditions: {
      timeWindow: {
        days: [1, 2, 3, 4, 5],
        startHour: 9,
        endHour: 17,
        timezone: "UTC",
      }
    },
  },
  {
    version: "2024-01-01",
    name: "Whitelist-Only Transfer",
    description: "Higher limit transfers restricted to pre-approved addresses",
    limits: {
      amount: "500",
      currency: "USDC",
      period: "weekly",
    },
    conditions: {
      recipients: {
        allowed: [
          "0x0000000000000000000000000000000000000001",
        ],
      },
    },
  },
];

export const policyTemplates: PolicyTemplate[] = policyDocuments.map((doc, index) => ({
  id: `template-${index + 1}`,
  name: doc.name,
  description: doc.description || "",
  icon: ["💼", "🔒"][index],
  category: "transfer",
  policy: doc,
}));

export function getAllTemplates(): PolicyTemplate[] {
  return policyTemplates;
}

export function getTemplatesByAdapter(adapterId: string): PolicyTemplate[] {
  return policyTemplates;
}

export function getTemplateByName(name: string): PolicyTemplate | undefined {
  return policyTemplates.find((t) => t.name === name);
}
