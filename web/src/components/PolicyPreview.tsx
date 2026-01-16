"use client";

import type { CompiledPolicy, PolicyFormState } from "../types/policy";

interface PolicyPreviewProps {
  compiled: CompiledPolicy | null;
  policyDocument: PolicyFormState;
  loading: boolean;
  error: string | null;
  onPolicyChange?: (policy: PolicyFormState) => void;
}

export function PolicyPreview({
  compiled,
  policyDocument,
  loading,
  error,
}: PolicyPreviewProps) {
  if (loading) {
    return (
      <div className="card-purple rounded-lg p-6">
        <div className="text-center text-purple-muted">Compiling policy...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-purple rounded-lg p-6 border-2 border-red-500">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Compilation Error</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!compiled) {
    return (
      <div className="card-purple rounded-lg p-6">
        <div className="text-center text-purple-muted">Configure policy to see preview</div>
      </div>
    );
  }

  const hasAnyPolicy = compiled.config.maxAmount?.enabled || 
                       compiled.config.timeWindow?.enabled || 
                       compiled.config.whitelist?.enabled;

  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-6 ${compiled.valid ? 'card-purple' : 'card-purple border-2 border-red-500'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-2xl ${compiled.valid ? '✅' : '❌'}`}></span>
          <h3 className="font-semibold text-white">
            {compiled.valid ? 'Policy Valid' : 'Policy Invalid'}
          </h3>
        </div>

        {compiled.valid && hasAnyPolicy && (
          <div className="space-y-3">
            <div className="text-sm text-purple-muted">
              {compiled.summary}
            </div>

            {compiled.config.maxAmount?.enabled && (
              <div className="p-3 bg-black/30 rounded-lg">
                <div className="text-xs text-purple-muted mb-1">Max Amount</div>
                <div className="text-sm text-white font-mono">
                  {(BigInt(compiled.config.maxAmount.limit) / BigInt(1e18)).toString()} MCK
                </div>
                <div className="text-xs text-purple-muted mt-1">
                  ({compiled.config.maxAmount.limit} wei)
                </div>
              </div>
            )}

            {compiled.config.timeWindow?.enabled && (
              <div className="p-3 bg-black/30 rounded-lg">
                <div className="text-xs text-purple-muted mb-1">Time Window</div>
                <div className="text-sm text-white">
                  {compiled.config.timeWindow.startHour}:00 - {compiled.config.timeWindow.endHour}:00 UTC
                </div>
              </div>
            )}

            {compiled.config.whitelist?.enabled && (
              <div className="p-3 bg-black/30 rounded-lg">
                <div className="text-xs text-purple-muted mb-1">Whitelist</div>
                <div className="text-xs text-white font-mono break-all">
                  Root: {compiled.config.whitelist.root?.slice(0, 10)}...{compiled.config.whitelist.root?.slice(-8)}
                </div>
                <div className="text-xs text-purple-muted mt-1">
                  {policyDocument.whitelist?.addresses.length || 0} address(es)
                </div>
              </div>
            )}
          </div>
        )}

        {compiled.valid && !hasAnyPolicy && (
          <div className="text-sm text-purple-muted">
            No policies configured. Enable at least one policy to protect your transactions.
          </div>
        )}

        {!compiled.valid && compiled.errors && (
          <div className="space-y-2">
            {compiled.errors.map((err, i) => (
              <div key={i} className="text-sm text-red-300">• {err}</div>
            ))}
          </div>
        )}
      </div>

      {compiled.valid && hasAnyPolicy && (
        <div className="p-4 bg-purple-subtle border border-purple rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-purple-accent text-lg">🔐</span>
            <div className="text-xs text-purple-muted">
              This policy will be verified in a zero-knowledge circuit. The agent cannot see or manipulate these constraints.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
