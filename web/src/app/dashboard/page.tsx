"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { trpc } from "../../trpc/client";
import type { PolicyConfig } from "../../types/policy";

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected, isConnecting, connect, isWrongNetwork, switchToSepolia } = useWallet();
  const [expandedAdapter, setExpandedAdapter] = useState<number | null>(null);

  const { data: installedAdaptersData, isLoading: loadingAdapters, refetch } = trpc.adapters.listMine.useQuery(
    { userAddress: address! as `0x${string}` },
    { enabled: !!address }
  );

  const toggleMutation = trpc.adapters.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const installedAdapters = installedAdaptersData?.adapters || [];

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Failed to toggle adapter:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Wallet Not Connected</h2>
            <p className="text-purple-muted mb-6">Connect your wallet to access your dashboard</p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-6 py-3 btn-purple rounded-lg font-medium text-white"
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Wrong Network</h2>
            <p className="text-purple-muted mb-6">Please switch to Mantle Sepolia</p>
            <button
              onClick={switchToSepolia}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white"
            >
              Switch Network
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
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">Dashboard</h1>
            <p className="text-purple-muted">Manage your automations and policies</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-purple rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Wallet Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-muted">Your Wallet:</span>
                    <span className="font-mono text-sm text-purple-accent">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="card-purple rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-400">Opaque Protocol Active</span>
                </div>
              </div>
            </div>

            <div className="card-purple rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">My Adapters</h3>
                <button
                  onClick={() => router.push("/adapters")}
                  className="px-4 py-2 btn-purple rounded-lg text-sm text-white"
                >
                  + Install New
                </button>
              </div>
              {loadingAdapters ? (
                <div className="text-center py-8 text-purple-muted">
                  <div className="text-sm">Loading...</div>
                </div>
              ) : installedAdapters.length === 0 ? (
                <div className="text-center py-8 text-purple-muted">
                  <p className="mb-2">No adapters installed yet</p>
                  <p className="text-sm mb-4">Install an adapter to start automating with ZK-policies</p>
                  <button
                    onClick={() => router.push("/adapters")}
                    className="px-4 py-2 btn-purple rounded-lg text-sm text-white"
                  >
                    Browse Adapters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedAdapters.map((adapter) => (
                    <AdapterCard
                      key={adapter.id}
                      adapter={adapter}
                      expanded={expandedAdapter === adapter.id}
                      onToggleExpand={() => setExpandedAdapter(expandedAdapter === adapter.id ? null : adapter.id)}
                      onToggleActive={() => handleToggle(adapter.id)}
                      isToggling={toggleMutation.isPending}
                    />
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


interface AdapterCardProps {
  adapter: {
    id: number;
    adapterId: string;
    name: string;
    config?: any;
    isActive: boolean;
    lastRun?: string;
    installedAt: string;
  };
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  isToggling: boolean;
}

function AdapterCard({ adapter, expanded, onToggleExpand, onToggleActive, isToggling }: AdapterCardProps) {
  const router = useRouter();
  const config = (adapter.config || {}) as PolicyConfig;

  const formatAmount = (wei: string) => {
    try {
      const amount = BigInt(wei) / BigInt(10 ** 18);
      return `${amount} MCK`;
    } catch {
      return wei;
    }
  };

  return (
    <div className="bg-black/30 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-white">{adapter.name}</h4>
              <div className={`w-2 h-2 rounded-full ${adapter.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            <div className="text-xs text-purple-muted font-mono">{adapter.adapterId}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleActive}
              disabled={isToggling}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                adapter.isActive
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              } disabled:opacity-50`}
            >
              {adapter.isActive ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={onToggleExpand}
              className="p-1 text-purple-muted hover:text-purple-accent transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-purple-muted">
          <span>Installed {new Date(adapter.installedAt).toLocaleDateString()}</span>
          {adapter.lastRun && (
            <span>Last run {new Date(adapter.lastRun).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-purple-subtle/20 p-4 space-y-3">
          <div>
            <div className="text-xs font-medium text-purple-accent mb-2">Policy Configuration</div>
            <div className="space-y-2">
              {config.maxAmount?.enabled && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-muted">Max Amount:</span>
                  <span className="text-white font-mono">{formatAmount(config.maxAmount.limit)}</span>
                </div>
              )}
              {config.timeWindow?.enabled && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-muted">Time Window:</span>
                  <span className="text-white">
                    {config.timeWindow.startHour}:00 - {config.timeWindow.endHour}:00 UTC
                  </span>
                </div>
              )}
              {config.whitelist?.enabled && config.whitelist.root && (
                <div className="text-xs">
                  <span className="text-purple-muted">Whitelist:</span>
                  <div className="mt-1 text-white font-mono text-xs">
                    Root: {config.whitelist.root.slice(0, 10)}...{config.whitelist.root.slice(-8)}
                  </div>
                </div>
              )}
              {!config.maxAmount?.enabled && !config.timeWindow?.enabled && !config.whitelist?.enabled && (
                <div className="text-xs text-purple-muted">No policies configured</div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-purple-subtle/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-purple-accent mb-1">Installation ID</div>
              <div className="text-xs text-white font-mono">{adapter.id}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/playground?installationId=${adapter.id}`)}
                className="px-3 py-1.5 text-xs btn-purple-outline rounded"
              >
                Test
              </button>
              <button
                onClick={() => router.push(`/adapters/${adapter.id}`)}
                className="px-3 py-1.5 text-xs btn-purple rounded text-white"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
