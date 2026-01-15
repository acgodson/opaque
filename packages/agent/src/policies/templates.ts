// Note: PolicyDocument removal - using any for simplified policy definitions
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  policy: any;
}

const policyDocuments: any[] = [
  {
    version: "1.0",
    name: "Safe Transfer Policy",
    description: "Limits transfers to trusted recipients within business hours",
    limits: {
      amount: "100",
      currency: "USDC",
    },
    conditions: {
      timeWindow: {
        startHour: 9,
        endHour: 17,
      },
    },
  },
];

export const policyTemplates: PolicyTemplate[] = policyDocuments.map((doc, index) => ({
  id: `template-${index + 1}`,
  name: doc.name,
  description: doc.description || "",
  icon: "🛡️",
  category: "mantle-transfer",
  policy: doc,
}));

export function getAllTemplates(): PolicyTemplate[] {
  return policyTemplates;
}

export function getTemplatesByAdapter(adapterId: string): PolicyTemplate[] {
  return policyTemplates;
}
