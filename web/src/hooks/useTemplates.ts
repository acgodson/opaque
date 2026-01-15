"use client";

import { trpc } from "../trpc/client";
import type { PolicyTemplate } from "../types/policy";

interface UseTemplatesResult {
  templates: PolicyTemplate[];
  loading: boolean;
  error: string | null;
}

export function useTemplates(): UseTemplatesResult {
  const { data, isLoading, error } = trpc.policies.getTemplates.useQuery(
    {},
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 60000,
    }
  );

  const templates = (data?.templates as PolicyTemplate[]) || [];
  
  return {
    templates,
    loading: isLoading,
    error: error?.message || null,
  };
}
