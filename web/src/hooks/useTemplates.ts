import { useState, useEffect } from "react";
import type { PolicyTemplate } from "../types/policy";

const templates: PolicyTemplate[] = [
  {
    id: "basic",
    name: "Basic Limit",
    description: "Simple amount limit per transaction",
    policy: {
      name: "Basic Transfer Policy",
      description: "Limits each transaction to 100 MCK",
      maxAmount: {
        enabled: true,
        limit: "100",
      },
    },
  },
  {
    id: "business-hours",
    name: "Business Hours",
    description: "Amount limit + time restrictions",
    policy: {
      name: "Business Hours Policy",
      description: "100 MCK limit during business hours",
      maxAmount: {
        enabled: true,
        limit: "100",
      },
      timeWindow: {
        enabled: true,
        startHour: 9,
        endHour: 17,
      },
    },
  },
  {
    id: "trusted-recipients",
    name: "Trusted Recipients",
    description: "Whitelist specific addresses",
    policy: {
      name: "Trusted Recipients Policy",
      description: "Only allow transfers to whitelisted addresses",
      maxAmount: {
        enabled: true,
        limit: "100",
      },
      whitelist: {
        enabled: true,
        addresses: [],
      },
    },
  },
  {
    id: "full-protection",
    name: "Full Protection",
    description: "All policies enabled",
    policy: {
      name: "Full Protection Policy",
      description: "Maximum security with all policies",
      maxAmount: {
        enabled: true,
        limit: "50",
      },
      timeWindow: {
        enabled: true,
        startHour: 9,
        endHour: 17,
      },
      whitelist: {
        enabled: true,
        addresses: [],
      },
    },
  },
];

export function useTemplates() {
  const [loading, setLoading] = useState(false);

  return {
    templates,
    loading,
  };
}
