"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PolicyBasicsForm } from "../../components/PolicyBasicsForm";
import { AdvancedConditionsForm } from "../../components/AdvancedConditionsForm";
import { PolicyPreview } from "../../components/PolicyPreview";
import { useCompiler } from "../../hooks/useCompiler";
import { useWallet } from "../../hooks/useWallet";
import { createEmptyPolicy, type PolicyFormState } from "../../types/policy";

export default function AdapterPlayground() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [policy, setPolicy] = useState<PolicyFormState>(createEmptyPolicy());
  const { compiled, loading: compiling } = useCompiler(policy);

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
            to: testRecipient,
            value: amountWei,
            data: "0x",
            timestamp: Math.floor(testTimestamp / 1000),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Enclave request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Proof generation failed");
      }

      setProofResult(data);
    } catch (err) {
      console.error("Proof generation failed:", err);
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

      // If whitelist has addresses, generate Merkle tree via tRPC
      if (processedConfig.whitelist?.enabled && processedConfig.whitelist.addresses) {
        const response = await fetch('/api/trpc/adapters.generateMerkle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: {
              addresses: processedConfig.whitelist.addresses,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate Merkle tree');
        }

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

      if (!response.ok) {
        throw new Error(`Enclave request failed: ${response.statusText}`);
      }

      const data = await response.json();
      setProofResult({ type: "STORE_POLICY", ...data });
    } catch (err) {
      console.error("Store policy failed:", err);
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
            <h2 className="text-2xl font-bold mb-4 text-white">Wallet Not Connected</h2>
            <p className="text-purple-muted mb-6">Connect your wallet to use the playground</p>
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
            className="text-purple-muted hover:text-purple-accent mb-6 flex items-center gap-2 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">Adapter Playground</h1>
            <p className="text-purple-muted">
              Test policy configurations and proof generation with the enclave
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">Policy Configuration</h3>
                <PolicyBasicsForm value={policy} onChange={setPolicy} />
              </div>

              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-white">Advanced Conditions</h3>
                <AdvancedConditionsForm value={policy} onChange={setPolicy} />
              </div>

              <div>
                <PolicyPreview
                  compiled={compiled}
                  policyDocument={policy}
                  loading={compiling}
                  onPolicyChange={(p) => setPolicy(p as PolicyFormState)} error={null} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-white">Test Transaction</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-purple-muted mb-1">Amount (MCK)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full input-purple rounded-lg px-3 py-2 text-sm"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-purple-muted mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      className="w-full input-purple rounded-lg px-3 py-2 text-sm font-mono"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-purple-muted mb-1">Timestamp</label>
                    <input
                      type="datetime-local"
                      value={new Date(testTimestamp).toISOString().slice(0, 16)}
                      onChange={(e) => setTestTimestamp(new Date(e.target.value).getTime())}
                      className="w-full input-purple rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleStorePolicyTest}
                      disabled={!compiled?.valid || generating}
                      className="w-full px-4 py-2 btn-purple-outline rounded-lg text-sm disabled:opacity-50"
                    >
                      {generating ? "Testing..." : "Test Store Policy"}
                    </button>

                    <button
                      onClick={handleGenerateProof}
                      disabled={!compiled?.valid || !testRecipient || generating}
                      className="w-full px-4 py-2 btn-purple rounded-lg text-sm text-white disabled:opacity-50"
                    >
                      {generating ? "Generating..." : "Generate Proof"}
                    </button>
                  </div>
                </div>
              </div>

              {proofError && (
                <div className="card-purple rounded-lg p-4 border border-red-500/20">
                  <h3 className="font-semibold mb-2 text-red-400">Error</h3>
                  <p className="text-sm text-red-300">{proofError}</p>
                </div>
              )}

              {proofResult && (
                <div className="card-purple rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-white">Result</h3>
                  <div className="bg-black/30 rounded p-3 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(proofResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="card-purple rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-white">Test Scenarios</h3>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => {
                      setTestAmount("150");
                      setTestRecipient("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
                    }}
                    className="w-full text-left px-3 py-2 bg-black/30 rounded hover:bg-black/50 transition-colors text-purple-muted"
                  >
                    <div className="font-medium text-white">Exceed Max Amount</div>
                    <div className="text-xs">Test with 150 MCK (above 100 limit)</div>
                  </button>

                  <button
                    onClick={() => {
                      setTestTimestamp(new Date().setHours(2, 0, 0, 0));
                    }}
                    className="w-full text-left px-3 py-2 bg-black/30 rounded hover:bg-black/50 transition-colors text-purple-muted"
                  >
                    <div className="font-medium text-white">Outside Time Window</div>
                    <div className="text-xs">Test at 2:00 AM (outside 9-17 window)</div>
                  </button>

                  <button
                    onClick={() => {
                      setTestRecipient("0x0000000000000000000000000000000000000001");
                    }}
                    className="w-full text-left px-3 py-2 bg-black/30 rounded hover:bg-black/50 transition-colors text-purple-muted"
                  >
                    <div className="font-medium text-white">Non-Whitelisted Address</div>
                    <div className="text-xs">Test with address not in whitelist</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
