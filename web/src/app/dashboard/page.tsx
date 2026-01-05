"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { useSession } from "../../hooks/useSession";
import { usePermission } from "../../hooks/usePermission";
import { trpc } from "../../trpc/client";
import type { CompiledPolicy } from "../../types/policy";
import { SignalStatusWidget } from "../../components/SignalStatusWidget";
import { AdapterPlayground } from "../../components/AdapterPlayground";

interface InstalledAdapter {
  id: number;
  adapterId: string;
  name: string;
  config: any;
  permissionId: number | null;
  isActive: boolean;
  lastRun: string | null;
  installedAt: string;
  sessions: Array<{
    sessionAccountId: string;
    address: string;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected, isConnecting, connect, isWrongNetwork, switchToSepolia } = useWallet();
  const { requestPermission, isRequesting, permissions, error, fetchPermissions } = usePermission(address);

  const [compiledPolicyData, setCompiledPolicyData] = useState<(CompiledPolicy & { adapterId?: string }) | null>(null);

  // Fetch installed adapters using tRPC
  const { data: installedAdaptersData, isLoading: loadingAdapters, refetch: refetchAdapters } = trpc.adapters.listInstalled.useQuery(
    { userAddress: address! as `0x${string}` },
    { enabled: !!address }
  );

  const installedAdapters = installedAdaptersData?.adapters || [];

  // Install adapter mutation
  const installAdapterMutation = trpc.adapters.install.useMutation({
    onSuccess: () => {
      refetchAdapters();
    },
  });

  // Fetch root delegator count for monitoring dashboard
  const rootDelegatorCount = trpc.envio.getRootDelegatorCount.useQuery(
    undefined,
    { refetchInterval: 30000 } 
  );

  useEffect(() => {
    const stored = localStorage.getItem("compiledPolicy");
    if (stored) {
      try {
        setCompiledPolicyData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored policy", e);
      }
    }
  }, []);

  // Create session for the specific adapter
  const { session, isLoading: sessionLoading } = useSession(address, compiledPolicyData?.adapterId);

  const handleGrantPermission = async () => {
    if (!session || !compiledPolicyData || !compiledPolicyData.adapterId || !compiledPolicyData.permission?.data) return;

    const result = await requestPermission({
      sessionAddress: session.address,
      tokenAddress: compiledPolicyData.permission.data.token,
      amount: compiledPolicyData.permission.data.allowance,
      period: compiledPolicyData.permission.data.period,
      adapterId: compiledPolicyData.adapterId,
    });

    if (result) {
      // Install the adapter using tRPC
      try {
        // Create adapter-specific config from policy document
        const adapterConfig = {
          tokenAddress: compiledPolicyData.permission?.data?.token || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          amountPerTransfer: compiledPolicyData.policy?.limits?.amount || "0.1",
          decimals: 6, // USDC default
          schedule: "0 9 * * *", // Daily at 9am (for cron-triggered executions)
        };

        await installAdapterMutation.mutateAsync({
          userAddress: address! as `0x${string}`,
          adapterId: compiledPolicyData.adapterId!,
          config: adapterConfig,
          permissionId: result.id,
        });

        console.log("Adapter installed successfully");
        await fetchPermissions();
        await refetchAdapters();

        localStorage.removeItem("compiledPolicy");
        setCompiledPolicyData(null);
      } catch (err) {
        console.error("Adapter installation error:", err);
      }
    }
  };

  const handleBackToAdapters = () => {
    localStorage.removeItem("compiledPolicy");
    setCompiledPolicyData(null);
    router.push("/adapters");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-zinc-400 mb-6">Connect your wallet to access your dashboard</p>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Wrong Network</h2>
          <p className="text-zinc-400 mb-6">Please switch to Sepolia testnet</p>
          <button
            onClick={switchToSepolia}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Switch to Sepolia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 -mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Manage your automations and permissions</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Your Wallet:</span>
                  <span className="font-mono text-sm">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                </div>
              </div>
            </div>

            <SignalStatusWidget />
          </div>

          {/* Monitoring Dashboard */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Monitoring Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-2">Root Delegators</div>
                <div className="text-3xl font-mono text-blue-400">
                  {rootDelegatorCount.isLoading ? "..." : (rootDelegatorCount.data?.count || 0)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Unique delegators on-chain</div>
              </div>
              {rootDelegatorCount.error && (
                <div className="md:col-span-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    Indexer connection issue: {rootDelegatorCount.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Permission Grant Section */}
          {compiledPolicyData && (
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Grant Permission</h3>
                  <p className="text-sm text-zinc-400">Approve this permission to activate your automation</p>
                </div>
                <button
                  onClick={handleBackToAdapters}
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-black/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">{compiledPolicyData.policy?.name || "Policy"}</div>
                    {compiledPolicyData.adapterId && (
                      <div className="text-xs text-zinc-400">
                        for {compiledPolicyData.adapterId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  {compiledPolicyData.summary || "No summary available"}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGrantPermission}
                disabled={isRequesting || !session}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    Grant Permission
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>

              <p className="mt-3 text-xs text-zinc-500 text-center">
                This will open MetaMask to approve the delegation permission
              </p>
            </div>
          )}

          {/* Installed Adapters */}
          {!compiledPolicyData && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Installed Adapters</h3>
                <button
                  onClick={() => router.push("/adapters")}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Browse Adapters →
                </button>
              </div>
              {loadingAdapters ? (
                <div className="text-center py-8 text-zinc-400">
                  <div className="text-sm">Loading adapters...</div>
                </div>
              ) : installedAdapters.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="mb-2">No adapters installed yet</p>
                  <p className="text-sm">Install an adapter to start automating</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedAdapters.map((adapter) => (
                    <div
                      key={adapter.id}
                      className="p-4 bg-zinc-800/50 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{adapter.name}</div>
                          <div className="text-xs text-zinc-400">
                            Installed {new Date(adapter.installedAt).toLocaleDateString()}
                          </div>
                          {adapter.lastRun && (
                            <div className="text-xs text-zinc-500">
                              Last run: {new Date(adapter.lastRun).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${adapter.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <span className={`text-xs ${adapter.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                            {adapter.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {adapter.sessions && adapter.sessions.length > 0 && (
                        <div className="pt-2 border-t border-zinc-700 space-y-2">
                          <div className="text-xs text-zinc-500 mb-2">Session Accounts:</div>
                          {adapter.sessions.map((session) => (
                            <div key={session.sessionAccountId} className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Session:</span>
                              <span className="font-mono text-zinc-300">
                                {session.address.slice(0, 8)}...{session.address.slice(-6)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <a
                            href={`/api-explorer/${adapter.adapterId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors text-zinc-300 hover:text-white"
                          >
                            <span>View API</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                        <AdapterPlayground
                          adapterId={adapter.adapterId}
                          adapterName={adapter.name}
                          userAddress={address!}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Granted Permissions */}
          {permissions.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Granted Permissions</h3>
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium">{perm.permissionType}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-1">
                        {perm.tokenAddress.slice(0, 10)}...{perm.tokenAddress.slice(-6)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-green-400">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
