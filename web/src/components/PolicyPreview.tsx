"use client";

import { useState } from "react";
import type { CompiledPolicy, PolicyDocument } from "../types/policy";

interface PolicyPreviewProps {
  compiled: CompiledPolicy | null;
  policyDocument: Partial<PolicyDocument>;
  loading?: boolean;
  error?: string | null;
  onPolicyChange?: (policy: Partial<PolicyDocument>) => void;
}

export function PolicyPreview({ compiled, policyDocument, loading, error, onPolicyChange }: PolicyPreviewProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "json">("summary");
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);
  const [showRulesDetails, setShowRulesDetails] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(policyDocument, null, 2));
  };

  const handleEditJson = () => {
    setJsonText(JSON.stringify(policyDocument, null, 2));
    setJsonError(null);
    setIsEditingJson(true);
  };

  const handleCancelEdit = () => {
    setIsEditingJson(false);
    setJsonText("");
    setJsonError(null);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);
      if (onPolicyChange) {
        onPolicyChange(parsed);
      }
      setIsEditingJson(false);
      setJsonText("");
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    // Clear error as user types
    if (jsonError) setJsonError(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "summary"
              ? "bg-zinc-800 text-white border-b-2 border-blue-500"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "json"
              ? "bg-zinc-800 text-white border-b-2 border-blue-500"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          JSON View
        </button>
      </div>

      <div className="p-6">
        {loading && (
          <div className="text-center py-8 text-zinc-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div className="mt-2">Compiling policy...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            <div className="font-semibold mb-1">❌ Compilation Error</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        {!loading && !error && activeTab === "summary" && (
          <>
            {compiled?.valid ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Policy is Valid</span>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Summary</div>
                  <p className="text-base leading-relaxed">{compiled.summary}</p>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <button
                    onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔐</span>
                      <span className="font-semibold">MetaMask Permission</span>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        showPermissionDetails ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {showPermissionDetails && compiled.permission && (
                    <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Type:</span>
                        <span>{compiled.permission.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Token:</span>
                        <span className="truncate ml-2">{compiled.permission.data.token}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Allowance:</span>
                        <span>{compiled.permission.data.allowance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Period:</span>
                        <span>{compiled.permission.data.period} seconds</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <button
                    onClick={() => setShowRulesDetails(!showRulesDetails)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚙️</span>
                      <span className="font-semibold">opaque Safeguards</span>
                      <span className="text-sm text-zinc-400">
                        ({compiled.rules.length} active)
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        showRulesDetails ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {showRulesDetails && (
                    <div className="mt-4 space-y-2">
                      {compiled.rules.map((rule, index) => (
                        <div
                          key={`${rule.policyType}-${index}`}
                          className="p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-400">✓</span>
                            <span className="font-medium text-sm">{rule.policyType}</span>
                          </div>
                          <div className="text-xs text-zinc-400 font-mono ml-6">
                            {JSON.stringify(rule.config)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <div className="text-4xl mb-2">📋</div>
                <div>Fill in the policy details to see the compiled output</div>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === "json" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-zinc-400">PolicyDocument JSON</div>
              <div className="flex gap-2">
                {!isEditingJson ? (
                  <>
                    <button
                      onClick={handleEditJson}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      ✏️ Edit JSON
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
                    >
                      Copy JSON
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveJson}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      ✓ Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {jsonError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                <span className="font-semibold">JSON Error:</span> {jsonError}
              </div>
            )}

            {isEditingJson ? (
              <textarea
                value={jsonText}
                onChange={handleJsonTextChange}
                className="w-full h-96 p-4 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                spellCheck={false}
              />
            ) : (
              <pre className="p-4 bg-black border border-zinc-800 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">
                  {JSON.stringify(policyDocument, null, 2)}
                </code>
              </pre>
            )}

            <div className="text-xs text-zinc-500">
              {isEditingJson ? (
                <>
                  Edit the JSON directly. Changes will be validated and automatically recompiled when
                  you save.
                </>
              ) : (
                <>
                  Click &quot;Edit JSON&quot; to manually edit the policy document. Changes will trigger live
                  compilation.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
