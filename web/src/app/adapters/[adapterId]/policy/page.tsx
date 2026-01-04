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
  "transfer-bot": {
    name: "Transfer Bot",
    description: "Transfers 0.1 USDC or 0.1 ETH per execution. Configure max amount per period (daily/weekly/monthly) with policies.",
  },
  "ai-savings-agent": {
    name: "AI Savings Agent",
    description: "Automatically transfers funds to your savings vault or address on a schedule. Set your savings amount, frequency, and target address. Policies control spending limits and ensure funds only go to your trusted vault.",
  },
};

export default function AdapterPolicyBuilder() {
  const router = useRouter();
  const params = useParams();
  const adapterId = params.adapterId as string;
  const adapterInfo = ADAPTER_INFO[adapterId] || { name: adapterId, description: "Automation adapter" };

  const { address, isConnected } = useWallet();
  const [policyDoc, setPolicyDoc] = useState<PolicyFormState>(createEmptyPolicy());
  const [showTemplates, setShowTemplates] = useState(false);

  const { compiled, loading, error } = useCompiler(policyDoc);
  const { templates, loading: templatesLoading } = useTemplates();

  // Set default policy name based on adapter
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
    setShowTemplates(false);
  };

  const handleContinue = () => {
    if (compiled?.valid) {
      // Store both the compiled policy and adapter ID
      localStorage.setItem("compiledPolicy", JSON.stringify({ ...compiled, adapterId }));
      // Redirect to dashboard for permission grant
      router.push("/dashboard");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-zinc-400 mb-6">Please connect your wallet to build a policy</p>
          <button
            onClick={() => router.push("/adapters")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Back to Adapters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 -mt-16">
        <div className="mb-6">
          <button
            onClick={() => router.push("/adapters")}
            className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2 text-sm"
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

          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{adapterInfo.name}</h1>
              <span className="px-2 py-1 text-xs bg-blue-600 rounded">Policy Builder</span>
            </div>
            <p className="text-zinc-400 text-sm">{adapterInfo.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-1">Configure Policy</h2>
            <p className="text-zinc-400 text-sm">
              Define spending limits and safety conditions for your {adapterInfo.name.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3">
            <div className="font-medium text-sm">Policy Templates</div>
            <div className="text-xs text-zinc-400">Choose a pre-built policy or customize from scratch</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {templatesLoading ? (
              <div className="col-span-4 text-center py-6 text-zinc-400 text-sm">
                Loading templates...
              </div>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-blue-600 transition-colors text-left group"
                >
                  <div className="font-medium text-sm mb-1 group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </div>
                  <div className="text-xs text-zinc-400 line-clamp-2">{template.description}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Basic Settings</h3>
              <PolicyBasicsForm value={policyDoc} onChange={setPolicyDoc} />
            </div>

            <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Advanced Conditions</h3>
              <p className="text-xs text-zinc-400 mb-3">
                Add optional safety conditions to restrict when and how transfers can occur
              </p>
              <AdvancedConditionsForm value={policyDoc} onChange={setPolicyDoc} />
            </div>
          </div>

          <div>
            <div className="lg:sticky lg:top-20">
              <h3 className="font-semibold mb-3">Preview</h3>
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
                  className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
