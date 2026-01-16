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
  const { isConnected } = useWallet();
  const [policyDoc, setPolicyDoc] = useState<PolicyFormState>(createEmptyPolicy());
  const [showTemplates, setShowTemplates] = useState(false);

  const { compiled, loading, error } = useCompiler(policyDoc);
  const { templates, loading: templatesLoading } = useTemplates();

  const handleTemplateSelect = (template: PolicyTemplate) => {
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
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-3 text-white">Connect Wallet</h2>
            <p className="text-purple-muted text-sm mb-4">Required to build a policy</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2 btn-purple rounded-lg text-sm text-white"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/")}
          className="text-purple-muted hover:text-purple-accent mb-4 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Build Policy</h1>
          <p className="text-purple-muted text-sm">Define transaction rules for your adapter</p>
        </div>

        {/* Templates Toggle */}
        <div className="mb-5">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full p-3 card-purple rounded-lg hover:border-purple-accent transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span className="text-sm text-white">Templates</span>
            </div>
            <svg
              className={`w-4 h-4 text-purple-muted transition-transform ${showTemplates ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showTemplates && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {templatesLoading ? (
                <div className="col-span-2 text-center py-4 text-purple-muted text-sm">Loading...</div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 card-purple rounded-lg hover:border-purple-accent transition-colors text-left"
                  >
                    <div className="font-medium text-sm text-white mb-1">{template.name}</div>
                    <div className="text-xs text-purple-muted">{template.description}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="card-purple rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-4 text-white">Settings</h2>
            <PolicyBasicsForm value={policyDoc} onChange={setPolicyDoc} />
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-6 self-start">
            <h2 className="text-sm font-semibold mb-3 text-white">Preview</h2>
            <PolicyPreview
              compiled={compiled}
              policyDocument={policyDoc}
              loading={loading}
              error={error}
            />

            {compiled?.valid && (
              <button
                onClick={handleContinue}
                className="w-full mt-4 px-5 py-3 btn-purple rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
