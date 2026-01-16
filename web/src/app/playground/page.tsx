"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PolicyBasicsForm } from "../../components/PolicyBasicsForm";
import { AdvancedConditionsForm } from "../../components/AdvancedConditionsForm";
import { PolicyPreview } from "../../components/PolicyPreview";
import { useCompiler } from "../../hooks/useCompiler";
import { useWallet } from "../../hooks/useWallet";
import { createEmptyPolicy, type PolicyFormState } from "../../types/policy";

const API_EXAMPLES = {
  healthCheck: {
    title: "Health Check",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d '{"type":"HEALTH_CHECK"}'`,
    response: `{
  "status": "healthy",
  "timestamp": "2026-01-16T14:00:00.000Z",
  "policyCount": 0
}`,
  },
  storePolicy: {
    title: "Store Policy",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d @policy.json`,
    body: `{
  "type": "STORE_POLICY_CONFIG",
  "userAddress": "0xf275...768C",
  "installationId": 1,
  "policyConfig": {
    "maxAmount": {
      "enabled": true,
      "limit": "100000000000000000000"
    },
    "timeWindow": {
      "enabled": false,
      "startHour": 0,
      "endHour": 23
    },
    "whitelist": {
      "enabled": false,
      "root": "0",
      "path": ["0", "0"],
      "index": 0
    }
  }
}`,
    response: `{
  "success": true,
  "message": "Policy config stored for 0xf275...768C:1"
}`,
  },
  generateProof: {
    title: "Generate Proof",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d @proof-request.json`,
    body: `{
  "type": "GENERATE_PROOF",
  "userAddress": "0xf275...768C",
  "installationId": 1,
  "txData": {
    "amount": "50000000000000000000",
    "recipient": "0x1234...5678",
    "timestamp": 1737043200,
    "userAddress": "0xf275...768C"
  }
}`,
    response: `{
  "success": true,
  "proof": "0x0000000000...",
  "publicInputs": {
    "policySatisfied": "0x01",
    "nullifier": "0x12b6...",
    "userAddressHash": "0x8a3f..."
  }
}`,
  },
};

export default function AdapterPlayground() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [policy, setPolicy] = useState<PolicyFormState>(createEmptyPolicy());
  const { compiled, loading: compiling } = useCompiler(policy);
  const [activeTab, setActiveTab] = useState<"test" | "api">("test");

  const [testAmount, setTestAmount] = useState("50");
  const [testRecipient, setTestRecipient] = useState("");
  const [testTimestamp, setTestTimestamp] = useState(Date.now());

  const [proofResult, setProofResult] = useState<any>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateProof = async () => {
    if (!compiled?.valid || !address) {
      setProofError("Invalid policy configuration or wallet not connected");
      return;
    }

    setGenerating(true);
    setProofError(null);
    setProofResult(null);

    try {
      const amountWei = (BigInt(testAmount) * BigInt(10 ** 18)).toString();
      const enclaveUrl = process.env.NEXT_PUBLIC_ENCLAVE_URL || "http://35.159.224.254:8001";
      
      const response = await fetch(enclaveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GENERATE_PROOF",
          userAddress: address,
          installationId: 999,
          txData: {
            amount: amountWei,
            recipient: testRecipient,
            timestamp: Math.floor(testTimestamp / 1000),
            userAddress: address,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Proof generation failed");
      }
      setProofResult(data);
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to generate proof");
    } finally {
      setGenerating(false);
    }
  };

  const handleStorePolicyTest = async () => {
    if (!compiled?.valid || !address) {
      setProofError("Invalid policy configuration or wallet not connected");
      return;
    }

    setGenerating(true);
    setProofError(null);
    setProofResult(null);

    try {
      let processedConfig = { ...compiled.config };

      if (processedConfig.whitelist?.enabled && processedConfig.whitelist.addresses) {
        const response = await fetch('/api/trpc/adapters.generateMerkle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { addresses: processedConfig.whitelist.addresses } }),
        });
        const merkleData = await response.json();
        processedConfig.whitelist = {
          enabled: true,
          root: merkleData.result.data.root,
          path: merkleData.result.data.path,
          index: merkleData.result.data.index,
        };
      }

      const enclaveUrl = process.env.NEXT_PUBLIC_ENCLAVE_URL || "http://35.159.224.254:8001";
      const response = await fetch(enclaveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STORE_POLICY_CONFIG",
          userAddress: address,
          installationId: 999,
          policyConfig: processedConfig,
        }),
      });

      const data = await response.json();
      setProofResult({ type: "STORE_POLICY", ...data });
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to store policy");
    } finally {
      setGenerating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Connect Wallet</h2>
            <p className="text-purple-muted">Connect your wallet to use the playground</p>
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/")}
            className="text-purple-muted hover:text-purple-accent mb-6 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Playground</h1>
            <p className="text-purple-muted text-sm">Test policies and proof generation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Policy Config */}
            <div className="space-y-4">
              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-white text-sm">Policy</h3>
                <PolicyBasicsForm value={policy} onChange={setPolicy} />
              </div>

              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-white text-sm">Advanced</h3>
                <AdvancedConditionsForm value={policy} onChange={setPolicy} />
              </div>

              <PolicyPreview
                compiled={compiled}
                policyDocument={policy}
                loading={compiling}
                onPolicyChange={(p) => setPolicy(p as PolicyFormState)}
                error={null}
              />
            </div>

            {/* Right: Test & API */}
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("test")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "test"
                      ? "bg-purple-accent text-white"
                      : "bg-black/30 text-purple-muted hover:text-white"
                  }`}
                >
                  Test
                </button>
                <button
                  onClick={() => setActiveTab("api")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "api"
                      ? "bg-purple-accent text-white"
                      : "bg-black/30 text-purple-muted hover:text-white"
                  }`}
                >
                  API Reference
                </button>
              </div>

              {activeTab === "test" ? (
                <>
                  <div className="card-purple rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-white text-sm">Test Transaction</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-purple-muted mb-1">Amount (MCK)</label>
                        <input
                          type="number"
                          value={testAmount}
                          onChange={(e) => setTestAmount(e.target.value)}
                          className="w-full input-purple rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-purple-muted mb-1">Recipient</label>
                        <input
                          type="text"
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          className="w-full input-purple rounded px-3 py-2 text-sm font-mono"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-purple-muted mb-1">Timestamp</label>
                        <input
                          type="datetime-local"
                          value={new Date(testTimestamp).toISOString().slice(0, 16)}
                          onChange={(e) => setTestTimestamp(new Date(e.target.value).getTime())}
                          className="w-full input-purple rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleStorePolicyTest}
                          disabled={!compiled?.valid || generating}
                          className="flex-1 px-3 py-2 btn-purple-outline rounded text-sm disabled:opacity-50"
                        >
                          Store Policy
                        </button>
                        <button
                          onClick={handleGenerateProof}
                          disabled={!compiled?.valid || !testRecipient || generating}
                          className="flex-1 px-3 py-2 btn-purple rounded text-sm text-white disabled:opacity-50"
                        >
                          {generating ? "..." : "Generate Proof"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {proofError && (
                    <div className="card-purple rounded-lg p-3 border border-red-500/30">
                      <p className="text-sm text-red-400">{proofError}</p>
                    </div>
                  )}

                  {proofResult && (
                    <div className="card-purple rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-white text-sm">Result</h3>
                      <pre className="text-xs text-green-400 font-mono bg-black/30 rounded p-3 overflow-x-auto">
                        {JSON.stringify(proofResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="card-purple rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-white text-sm">Quick Tests</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Exceed Limit", action: () => { setTestAmount("150"); setTestRecipient("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"); }},
                        { label: "Outside Hours", action: () => setTestTimestamp(new Date().setHours(2, 0, 0, 0)) },
                        { label: "Invalid Address", action: () => setTestRecipient("0x0000000000000000000000000000000000000001") },
                      ].map((test) => (
                        <button
                          key={test.label}
                          onClick={test.action}
                          className="w-full text-left px-3 py-2 bg-black/20 rounded text-sm text-purple-muted hover:bg-black/30"
                        >
                          {test.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {Object.entries(API_EXAMPLES).map(([key, api]) => (
                    <div key={key} className="card-purple rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-mono">
                          {api.method}
                        </span>
                        <h3 className="font-semibold text-white text-sm">{api.title}</h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-purple-muted">cURL</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(api.curl)}
                              className="text-xs text-purple-accent hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs font-mono bg-black/40 rounded p-3 overflow-x-auto text-gray-300">
                            {api.curl}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs text-purple-muted">Response</span>
                          <pre className="text-xs font-mono bg-black/40 rounded p-2 overflow-x-auto text-green-400 mt-1">
                            {api.response}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
