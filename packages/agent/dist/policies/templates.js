const policyDocuments = [
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
export const policyTemplates = policyDocuments.map((doc, index) => ({
    id: `template-${index + 1}`,
    name: doc.name,
    description: doc.description || "",
    icon: "🛡️",
    category: "mantle-transfer",
    policy: doc,
}));
export function getAllTemplates() {
    return policyTemplates;
}
export function getTemplatesByAdapter(adapterId) {
    return policyTemplates;
}
