"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { trpc } from "../../trpc/client";

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected, isConnecting, connect, isWrongNetwork, switchToSepolia } = useWallet();

  const { data: installedAdaptersData, isLoading: loadingAdapters } = trpc.adapters.listInstalled.useQuery(
    { userAddress: address! as `0x${string}` },
    { enabled: !!address }
  );

  const installedAdapters = installedAdaptersData?.adapters || [];

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
                <h3 className="text-lg font-semibold text-white">Enabled Automations</h3>
                <button
                  onClick={() => router.push("/adapters")}
                  className="text-sm text-purple-accent hover:underline"
                >
                  Browse Adapters →
                </button>
              </div>
              {loadingAdapters ? (
                <div className="text-center py-8 text-purple-muted">
                  <div className="text-sm">Loading...</div>
                </div>
              ) : installedAdapters.length === 0 ? (
                <div className="text-center py-8 text-purple-muted">
                  <p className="mb-2">No automations enabled yet</p>
                  <p className="text-sm">Enable an adapter to start automating</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedAdapters.map((adapter) => (
                    <div
                      key={adapter.id}
                      className="flex justify-between items-center p-3 bg-black/30 rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{adapter.name}</div>
                        <div className="text-xs text-purple-muted font-mono mt-1">
                          {adapter.adapterId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-green-400">Active</span>
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
