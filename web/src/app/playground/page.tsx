"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PolicyBasicsForm } from "../../components/PolicyBasicsForm";
import { AdvancedConditionsForm } from "../../components/AdvancedConditionsForm";
import { PolicyPreview } from "../../components/PolicyPreview";
import { useCompiler } from "../../hooks/useCompiler";
import { useWallet } from "../../hooks/useWallet";
import { trpc } from "../../trpc/client";
import { createEmptyPolicy, type PolicyFormState } from "../../types/policy";
import { formatUnits, encodeFunctionData, parseUnits } from "viem";
import { OPAQUE_VERIFIER_ABI, ERC20_ABI, OPAQUE_VERIFIER_ADDRESS, MCK_TOKEN_ADDRESS } from "../../lib/contracts";

const API_EXAMPLES = {
  healthCheck: {
    title: "Health Check",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d '{"type":"HEALTH_CHECK"}'`,
    response: `{"status":"healthy","timestamp":"...","policyCount":0}`,
  },
  storePolicy: {
    title: "Store Policy",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d '{"type":"STORE_POLICY_CONFIG","userAddress":"0x...","installationId":1,"policyConfig":{...}}'`,
    response: `{"success":true,"message":"Policy config stored"}`,
  },
  generateProof: {
    title: "Generate Proof",
    method: "POST",
    curl: `curl -X POST http://35.159.224.254:8001 \\
  -H "Content-Type: application/json" \\
  -d '{"type":"GENERATE_PROOF","userAddress":"0x...","installationId":1,"txData":{...}}'`,
    response: `{"success":true,"proof":"0x...","publicInputs":{...}}`,
  },
};

function PlaygroundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const installationId = searchParams.get("installationId");
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
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Mutations for enclave operations
  const generateProofMutation = trpc.adapters.generateProof.useMutation();
  const storePolicyMutation = trpc.adapters.storePolicyInEnclave.useMutation();
  const generateMerkleMutation = trpc.adapters.generateMerkle.useMutation();
  const verifyMutation = trpc.verification.verify.useMutation();

  // Fetch installed adapter if installationId is provided
  const { data: myAdapters } = trpc.adapters.listMine.useQuery(
    { userAddress: address || "" },
    { enabled: !!installationId && !!address }
  );

  const installedAdapter = myAdapters?.adapters?.find(
    (a) => a.id === parseInt(installationId || "0")
  );
  const installedConfig = installedAdapter?.config as any;

  // Mode: "installed" if we have an installationId, "sandbox" otherwise
  const mode = installationId && installedAdapter ? "installed" : "sandbox";

  // Prefill policy from installed adapter
  useEffect(() => {
    if (installedConfig && mode === "installed") {
      const prefilled: PolicyFormState = {
        name: installedAdapter?.name || "Installed Policy",
        description: "",
        maxAmount: {
          enabled: !!installedConfig.maxAmount?.enabled,
          limit: installedConfig.maxAmount?.limit
            ? formatUnits(BigInt(installedConfig.maxAmount.limit), 18)
            : "100",
        },
        timeWindow: installedConfig.timeWindow?.enabled
          ? {
            enabled: true,
            startHour: installedConfig.timeWindow.startHour,
            endHour: installedConfig.timeWindow.endHour,
          }
          : undefined,
        whitelist: installedConfig.whitelist?.enabled
          ? {
            enabled: true,
            addresses: [], // Can't recover addresses from root
          }
          : undefined,
      };
      setPolicy(prefilled);
    }
  }, [installedConfig, mode, installedAdapter?.name]);

  const handleGenerateProof = async () => {
    if (!address) {
      setProofError("Wallet not connected");
      return;
    }

    const effectiveInstallationId = mode === "installed" ? parseInt(installationId!) : 999;

    setGenerating(true);
    setProofError(null);
    setProofResult(null);

    try {
      const amountWei = (BigInt(testAmount) * BigInt(10 ** 18)).toString();

      const data = await generateProofMutation.mutateAsync({
        userAddress: address,
        installationId: effectiveInstallationId,
        txData: {
          amount: amountWei,
          recipient: testRecipient,
          timestamp: Math.floor(testTimestamp / 1000),
        },
      });

      setProofResult(data);
      // Reset verification when new proof is generated
      setVerificationResult(null);
      setTxHash(null);
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Failed to generate proof");
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proofResult?.proof || !proofResult?.publicInputs) return;

    setVerifying(true);
    setProofError(null);

    try {
      const result = await verifyMutation.mutateAsync({
        proof: proofResult.proof,
        publicInputs: [
          proofResult.publicInputs.policySatisfied,
          proofResult.publicInputs.nullifier,
          proofResult.publicInputs.userAddressHash,
        ],
      });
      setVerificationResult(result);
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!proofResult?.proof || !proofResult?.publicInputs || !address || !window.ethereum) return;

    setSending(true);
    setProofError(null);

    try {
      // Enclave returns proof as hex string without 0x prefix
      let proofHex: `0x${string}`;
      proofHex = (proofResult.proof.startsWith('0x') ? proofResult.proof : `0x${proofResult.proof}`) as `0x${string}`;

      const policySatisfied = proofResult.publicInputs.policySatisfied as `0x${string}`;
      const nullifier = proofResult.publicInputs.nullifier as `0x${string}`;
      const userAddressHash = proofResult.publicInputs.userAddressHash as `0x${string}`;

      const amountWei = parseUnits(testAmount, 18);
      const erc20TransferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [testRecipient as `0x${string}`, amountWei],
      });

      const verifyAndExecuteData = encodeFunctionData({
        abi: OPAQUE_VERIFIER_ABI,
        functionName: 'verifyAndExecute',
        args: [
          proofHex,
          policySatisfied,
          nullifier,
          userAddressHash,
          MCK_TOKEN_ADDRESS as `0x${string}`,
          erc20TransferData,
        ],
      });

      const txParams = {
        from: address,
        to: OPAQUE_VERIFIER_ADDRESS,
        data: verifyAndExecuteData,
        chainId: '0x138b',
      };

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setTxHash(hash);
    } catch (err: any) {
      setProofError(err.message || "Transaction failed");
    } finally {
      setSending(false);
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
        const merkleData = await generateMerkleMutation.mutateAsync({
          addresses: processedConfig.whitelist.addresses,
        });
        processedConfig.whitelist = {
          enabled: true,
          root: merkleData.root,
          path: merkleData.path,
          index: merkleData.index,
        };
      }

      const data = await storePolicyMutation.mutateAsync({
        userAddress: address,
        installationId: 999,
        policyConfig: processedConfig,
      });

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
            <h2 className="text-xl font-semibold mb-3 text-white">Connect Wallet</h2>
            <p className="text-purple-muted text-sm">Required to use playground</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push(mode === "installed" ? `/adapters/${installationId}` : "/")}
          className="text-purple-muted hover:text-purple-accent mb-4 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Playground</h1>
          <p className="text-purple-muted text-sm">
            {mode === "installed"
              ? `Testing adapter #${installationId} - Policy is locked`
              : "Sandbox mode - Configure and test policies"}
          </p>
        </div>

        {/* Mode Banner */}
        {mode === "installed" ? (
          <div className="mb-5 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <span className="text-green-400">✓</span>
            <div className="text-sm text-green-400">
              Testing installed adapter #{installationId}. Policy is already stored in enclave.
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <span className="text-yellow-400">⚠</span>
            <div className="text-sm text-yellow-400">
              Sandbox mode. You must click "Store Policy" before generating proofs.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Policy Config */}
          <div className="space-y-4">
            <div className={`card-purple rounded-lg p-4 ${mode === "installed" ? "opacity-60" : ""}`}>
              <h3 className="font-semibold mb-3 text-white text-sm">
                Policy {mode === "installed" && <span className="text-purple-muted">(Read-only)</span>}
              </h3>
              <div className={mode === "installed" ? "pointer-events-none" : ""}>
                <PolicyBasicsForm value={policy} onChange={setPolicy} />
              </div>
            </div>

            <div className={`card-purple rounded-lg p-4 ${mode === "installed" ? "opacity-60" : ""}`}>
              <h3 className="font-semibold mb-3 text-white text-sm">Advanced</h3>
              <div className={mode === "installed" ? "pointer-events-none" : ""}>
                <AdvancedConditionsForm value={policy} onChange={setPolicy} />
              </div>
            </div>

            <PolicyPreview
              compiled={compiled}
              policyDocument={policy}
              loading={compiling}
              error={null}
            />
          </div>

          {/* Right: Test & API */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("test")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "test"
                    ? "bg-purple-accent text-white"
                    : "bg-black/30 text-purple-muted hover:text-white"
                  }`}
              >
                Test
              </button>
              <button
                onClick={() => setActiveTab("api")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "api"
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
                      {mode === "sandbox" && (
                        <button
                          onClick={handleStorePolicyTest}
                          disabled={!compiled?.valid || generating}
                          className="flex-1 px-3 py-2 btn-purple-outline rounded text-sm disabled:opacity-50"
                        >
                          Store Policy
                        </button>
                      )}
                      <button
                        onClick={handleGenerateProof}
                        disabled={!testRecipient || generating}
                        className={`${mode === "sandbox" ? "flex-1" : "w-full"} px-3 py-2 btn-purple rounded text-sm text-white disabled:opacity-50`}
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

                {proofResult && proofResult.success && (
                  <>
                    {/* Proof Result */}
                    <div className="card-purple rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white text-sm">Proof Generated</h3>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          ✓ Success
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-purple-muted">Policy Satisfied:</span>
                          <span className="text-white font-mono">{proofResult.publicInputs?.policySatisfied === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-muted">Nullifier:</span>
                          <span className="text-white font-mono">{proofResult.publicInputs?.nullifier?.slice(0, 16)}...</span>
                        </div>
                      </div>
                      <details className="mt-3">
                        <summary className="text-xs text-purple-muted cursor-pointer hover:text-purple-accent">
                          View raw proof
                        </summary>
                        <pre className="text-xs text-green-400 font-mono bg-black/30 rounded p-2 mt-2 overflow-x-auto max-h-32">
                          {JSON.stringify(proofResult, null, 2)}
                        </pre>
                      </details>
                    </div>

                    {/* Verification Card */}
                    <div className="card-purple rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-white text-sm">Off-Chain Verification</h3>
                      {verificationResult ? (
                        <div className={`p-3 rounded-lg ${verificationResult.verified ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <div className="flex items-center gap-2">
                            <span className={verificationResult.verified ? 'text-green-400' : 'text-red-400'}>
                              {verificationResult.verified ? '✓' : '✗'}
                            </span>
                            <span className={`text-sm ${verificationResult.verified ? 'text-green-400' : 'text-red-400'}`}>
                              {verificationResult.message}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleVerifyProof}
                          disabled={verifying}
                          className="w-full px-3 py-2 btn-purple-outline rounded text-sm disabled:opacity-50"
                        >
                          {verifying ? "Verifying..." : "Verify Proof Off-Chain"}
                        </button>
                      )}
                    </div>

                    {/* Send Transaction Card */}
                    <div className="card-purple rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-white text-sm">Execute Transaction</h3>
                      {txHash ? (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-sm text-green-400">Transaction Sent</span>
                          </div>
                          <a
                            href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-accent hover:underline font-mono break-all"
                          >
                            {txHash}
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs text-purple-muted">
                            Send {testAmount} MCK to {testRecipient?.slice(0, 10)}...
                          </div>
                          <button
                            onClick={handleSendTransaction}
                            disabled={sending || !verificationResult?.verified}
                            className="w-full px-3 py-2 btn-purple rounded text-sm text-white disabled:opacity-50"
                          >
                            {sending ? "Sending..." : "Send Transaction"}
                          </button>
                          {!verificationResult?.verified && (
                            <p className="text-xs text-purple-muted text-center">
                              Verify proof first before sending
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {proofResult && proofResult.type === "STORE_POLICY" && (
                  <div className="card-purple rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-white text-sm">Policy Stored</h3>
                    <pre className="text-xs text-green-400 font-mono bg-black/30 rounded p-3 overflow-x-auto">
                      {JSON.stringify(proofResult, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {Object.entries(API_EXAMPLES).map(([key, api]) => (
                  <div key={key} className="card-purple rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-mono">
                        {api.method}
                      </span>
                      <h3 className="font-semibold text-white text-sm">{api.title}</h3>
                    </div>
                    <pre className="text-xs font-mono bg-black/40 rounded p-2 overflow-x-auto text-gray-300 mb-2">
                      {api.curl}
                    </pre>
                    <pre className="text-xs font-mono bg-black/40 rounded p-2 overflow-x-auto text-green-400">
                      {api.response}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdapterPlayground() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-purple-muted text-sm">Loading...</div>
        </div>
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  );
}
