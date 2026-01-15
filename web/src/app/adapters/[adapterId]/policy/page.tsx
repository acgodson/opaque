"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PolicyBasicsForm } from "../../../../components/PolicyBasicsForm";
import { AdvancedConditionsForm } from "../../../../components/AdvancedConditionsForm";
import { PolicyPreview } from "../../../../components/PolicyPreview";
import { useCompiler } from "../../../../hooks/useCompiler";
import { useTemplates } from "../../../../hooks/useTemplates";
import { useWallet } from "../../../../hooks/useWallet";
import { createEmptyPolicy, type PolicyFormState, type PolicyTemplate } from "../../../../types/policy";

const ADAPTER_INFO: Record<string, { name: string; description: string }> = {
  "mantle-transfer": {
    name: "Mantle Transfer",
    description: "Transfers ERC20 tokens on Mantle Sepolia. Configure ZK-policies for spending limits and recipient whitelists.",
  }
};

export default function AdapterPolicyBuilder() {
  const router = useRouter();
  const params = useParams();
  const adapterId = params.adapterId as string;
  const adapterInfo = ADAPTER_INFO[adapterId] || { name: adapterId, description: "Automation adapter" };

  const { address, isConnected } = useWallet();
  const [policyDoc, setPolicyDoc] = useState<PolicyFormState>(createEmptyPolicy());

  const { compiled, loading, error } = useCompiler(policyDoc);
  const { templates, loading: templatesLoading } = useTemplates();

  useEffect(() => {
    if (!policyDoc.name || policyDoc.name === "") {
      setPolicyDoc(prev => ({
        ...prev,
        name: `${adapterInfo.name} Policy`,
      }));
    }
  }, [adapterId, adapterInfo.name]);

  const handleTemplateSelect = (template: PolicyTemplate) => {
    setPolicyDoc(template.policy as PolicyFormState);
  };

  const handleContinue = () => {
    if (compiled?.valid) {
      localStorage.setItem("compiledPolicy", JSON.stringify({ ...compiled, adapterId }));
      router.push("/dashboard");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Wallet Not Connected</h2>
            <p className="text-purple-muted mb-6">Please connect your wallet to build a policy</p>
            <button
              onClick={() => router.push("/adapters")}
              className="px-6 py-3 btn-purple rounded-lg font-medium text-white"
            >
              Back to Adapters
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
      
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/adapters")}
              className="text-purple-muted hover:text-purple-accent mb-4 flex items-center gap-2 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Adapters
            </button>

            <div className="card-featured rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{adapterInfo.name}</h1>
                <span className="px-2 py-1 text-xs bg-purple-subtle text-purple-accent rounded">Policy Builder</span>
              </div>
              <p className="text-purple-muted text-sm">{adapterInfo.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-1 text-white">Configure Policy</h2>
              <p className="text-purple-muted text-sm">
                Define spending limits and safety conditions for your {adapterInfo.name.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3">
              <div className="font-medium text-sm text-white">Policy Templates</div>
              <div className="text-xs text-purple-muted">Choose a pre-built policy or customize from scratch</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {templatesLoading ? (
                <div className="col-span-4 text-center py-6 text-purple-muted text-sm">
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="col-span-4 text-center py-6 text-purple-muted text-sm">
                  No templates available
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 card-purple rounded-lg transition-all text-left group"
                  >
                    <div className="font-medium text-sm mb-1 text-white group-hover:text-purple-accent transition-colors">
                      {template.name}
                    </div>
                    <div className="text-xs text-purple-muted line-clamp-2">{template.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">Basic Settings</h3>
                <PolicyBasicsForm value={policyDoc} onChange={setPolicyDoc} />
              </div>

              <div className="mt-4 card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-white">Advanced Conditions</h3>
                <p className="text-xs text-purple-muted mb-3">
                  Add optional safety conditions to restrict when and how transfers can occur
                </p>
                <AdvancedConditionsForm value={policyDoc} onChange={setPolicyDoc} />
              </div>
            </div>

            <div>
              <div className="lg:sticky lg:top-20">
                <h3 className="font-semibold mb-3 text-white">Preview</h3>
                <PolicyPreview
                  compiled={compiled}
                  policyDocument={policyDoc}
                  loading={loading}
                  error={error}
                  onPolicyChange={(policy) => setPolicyDoc(policy as PolicyFormState)}
                />

                {compiled?.valid && (
                  <button
                    onClick={handleContinue}
                    className="w-full mt-4 px-6 py-3 btn-purple rounded-lg font-medium text-white flex items-center justify-center gap-2"
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
    </div>
  );
}
