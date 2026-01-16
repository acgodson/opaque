"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "../../../trpc/client";
import { useWallet } from "../../../hooks/useWallet";
import { formatUnits } from "viem";

export default function AdapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adapterId = params.adapterId as string;
  const { address } = useWallet();

  const isNumericId = /^\d+$/.test(adapterId);

  // For numeric IDs, fetch from user's installed adapters
  const { data: myAdapters, isLoading } = trpc.adapters.listMine.useQuery(
    { userAddress: address || "" },
    { enabled: isNumericId && !!address }
  );

  const { data: proofHistory } = trpc.adapters.getProofHistory.useQuery(
    { adapterId: parseInt(adapterId) },
    { enabled: isNumericId }
  );

  // Featured adapter (id=0)
  if (adapterId === "0") {
    return <FeaturedAdapterDetail />;
  }

  // Find the specific adapter
  const adapter = myAdapters?.adapters?.find(a => a.id === parseInt(adapterId));

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-purple-muted text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!adapter && isNumericId) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-3 text-white">Adapter Not Found</h2>
            <p className="text-purple-muted text-sm mb-4">This adapter doesn't exist or you don't have access</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 btn-purple rounded-lg text-sm text-white"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const config = adapter?.config as any || {};

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-purple-muted hover:text-purple-accent mb-6 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="card-purple rounded-lg p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-white">{adapter?.name || adapter?.adapterId}</h1>
            <div className={`px-2 py-1 text-xs rounded ${adapter?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {adapter?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <p className="text-purple-muted text-sm">Installation ID: {adapter?.id}</p>
        </div>

        {/* Policy Configuration */}
        <div className="card-purple rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-4">Policy Configuration</h2>
          
          <div className="space-y-3">
            {config.maxAmount?.enabled && (
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>💰</span>
                  <span className="text-sm text-purple-muted">Max Amount</span>
                </div>
                <span className="text-sm text-white font-mono">
                  {formatUnits(BigInt(config.maxAmount.limit || "0"), 18)} MCK
                </span>
              </div>
            )}

            {config.timeWindow?.enabled && (
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>🕐</span>
                  <span className="text-sm text-purple-muted">Time Window</span>
                </div>
                <span className="text-sm text-white">
                  {config.timeWindow.startHour}:00 - {config.timeWindow.endHour}:00 UTC
                </span>
              </div>
            )}

            {config.whitelist?.enabled && (
              <div className="p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span>📋</span>
                  <span className="text-sm text-purple-muted">Whitelist</span>
                </div>
                <div className="text-xs text-white font-mono break-all">
                  Root: {config.whitelist.root?.slice(0, 20)}...
                </div>
              </div>
            )}

            {!config.maxAmount?.enabled && !config.timeWindow?.enabled && !config.whitelist?.enabled && (
              <p className="text-sm text-purple-muted">No policies configured</p>
            )}
          </div>
        </div>

        {/* Token Info */}
        {adapter?.tokenSymbol && (
          <div className="card-purple rounded-lg p-5 mb-5">
            <h2 className="text-sm font-semibold text-white mb-3">Token</h2>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-purple-subtle rounded text-purple-accent text-sm">
                {adapter.tokenSymbol}
              </span>
              {adapter.tokenAddress && (
                <a
                  href={`https://sepolia.mantlescan.xyz/token/${adapter.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-muted font-mono hover:text-purple-accent"
                >
                  {adapter.tokenAddress.slice(0, 10)}...{adapter.tokenAddress.slice(-8)} →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card-purple rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/playground?installationId=${adapter?.id}`)}
              className="px-4 py-2 btn-purple rounded-lg text-sm text-white"
            >
              Test in Playground
            </button>
            <a
              href={`https://sepolia.mantlescan.xyz/address/0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 btn-purple-outline rounded-lg text-sm"
            >
              View Verifier Contract →
            </a>
          </div>
        </div>

        {/* Proof History */}
        {proofHistory && proofHistory.proofs.length > 0 && (
          <div className="card-purple rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Proof History</h2>
            <div className="space-y-2">
              {proofHistory.proofs.map((proof) => (
                <div key={proof.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded ${proof.isUsed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {proof.isUsed ? 'Used' : 'Valid'}
                    </span>
                    <span className="font-mono text-purple-muted">
                      {proof.nullifier.slice(0, 10)}...
                    </span>
                  </div>
                  <span className="text-purple-muted">
                    {new Date(proof.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedAdapterDetail() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/")}
          className="text-purple-muted hover:text-purple-accent mb-6 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="card-purple rounded-lg p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-xs bg-purple-subtle text-purple-accent rounded">✨ Featured</span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Demo: Mantle Transfer Agent</h1>
          <p className="text-purple-muted text-sm mb-4">
            Live demo with ZK-policy protection on Mantle Sepolia
          </p>
          <a href="/demo" className="px-4 py-2 btn-purple rounded-lg text-sm text-white inline-block">
            Open Agent Chat →
          </a>
        </div>

        <div className="card-purple rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-3">Policy Rules</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-sm text-purple-muted">💰 Max Amount</span>
              <span className="text-sm text-white">100 MCK</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-sm text-purple-muted">🕐 Time Window</span>
              <span className="text-sm text-white">9:00 - 17:00 UTC</span>
            </div>
          </div>
        </div>

        <div className="card-purple rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Contracts</h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-purple-muted">Verifier</span>
              <a href="https://sepolia.mantlescan.xyz/address/0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361" target="_blank" className="font-mono text-purple-accent hover:underline">
                0x07D6...6361
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-purple-muted">Token (MCK)</span>
              <a href="https://sepolia.mantlescan.xyz/token/0xb9e8f815ADC8418DD28f35A7D147c98f725fa538" target="_blank" className="font-mono text-purple-accent hover:underline">
                0xb9e8...a538
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-purple-muted">Enclave</span>
              <span className="font-mono text-purple-muted">http://35.159.224.254:8001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
