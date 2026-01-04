"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PolicyBasicsForm } from "../../components/PolicyBasicsForm";
import { PolicyPreview } from "../../components/PolicyPreview";
import { useCompiler } from "../../hooks/useCompiler";
import { useTemplates } from "../../hooks/useTemplates";
import { useWallet } from "../../hooks/useWallet";
import { createEmptyPolicy, type PolicyFormState, type PolicyTemplate } from "../../types/policy";

export default function PolicyBuilderPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [policyDoc, setPolicyDoc] = useState<PolicyFormState>(createEmptyPolicy());
  const [showTemplates, setShowTemplates] = useState(false);

  const { compiled, loading, error } = useCompiler(policyDoc);
  const { templates, loading: templatesLoading } = useTemplates();

  const handleTemplateSelect = (template: PolicyTemplate) => {
    // Use the policy from the template
    setPolicyDoc(template.policy as PolicyFormState);
    setShowTemplates(false);
  };

  const handleContinue = () => {
    if (compiled?.valid) {
      localStorage.setItem("compiledPolicy", JSON.stringify(compiled));
      router.push("/");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-zinc-400 mb-6">Please connect your wallet to build a policy</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-8 -mt-16">
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">Build Policy</h1>
          <p className="text-zinc-400">
            Create a policy to control how your automation adapter can execute transactions
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="font-medium">Start with a Template</div>
                <div className="text-sm text-zinc-400">
                  Choose from pre-built policies or start from scratch
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${showTemplates ? "rotate-180" : ""}`}
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

          {showTemplates && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesLoading ? (
                <div className="col-span-2 text-center py-8 text-zinc-400">
                  Loading templates...
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-blue-600 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon || "📄"}</span>
                      <div>
                        <div className="font-medium mb-1">{template.name}</div>
                        <div className="text-sm text-zinc-400">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Policy Settings</h2>
              <PolicyBasicsForm value={policyDoc} onChange={setPolicyDoc} />
            </div>
          </div>

          <div>
            <div className="lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <PolicyPreview
                compiled={compiled}
                policyDocument={policyDoc}
                loading={loading}
                error={error}
              />

              {compiled?.valid && (
                <button
                  onClick={handleContinue}
                  className="w-full mt-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Permission Grant
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
