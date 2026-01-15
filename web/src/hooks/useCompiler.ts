"use client";

import { useState, useEffect } from "react";
import { trpc } from "../trpc/client";
import type { PolicyDocument, CompiledPolicy } from "../types/policy";

interface UseCompilerResult {
  compiled: CompiledPolicy | null;
  loading: boolean;
  error: string | null;
}

export function useCompiler(policyDocument: Partial<PolicyDocument>): UseCompilerResult {
  const [compiled, setCompiled] = useState<CompiledPolicy | null>(null);
  const [debouncedDoc, setDebouncedDoc] = useState<Partial<PolicyDocument> | null>(null);

  const compileMutation = trpc.policies.compile.useMutation({
    onSuccess: (data) => {
      setCompiled(data.compiled as CompiledPolicy);
    },
    onError: (error) => {
      setCompiled(null);
    },
  });

  useEffect(() => {
    if (!policyDocument.limits?.amount || !policyDocument.limits?.currency) {
      setCompiled(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedDoc(policyDocument);
    }, 300);

    return () => clearTimeout(timer);
  }, [policyDocument]);

  useEffect(() => {
    if (debouncedDoc) {
      compileMutation.mutate(debouncedDoc);
    }
  }, [debouncedDoc]);

  return {
    compiled,
    loading: compileMutation.isPending,
    error: compileMutation.error?.message || null,
  };
}
