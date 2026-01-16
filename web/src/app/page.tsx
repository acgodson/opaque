"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../hooks/useWallet";
import { trpc } from "../trpc/client";

type TabType = "active" | "public" | "mine";

interface AdapterDisplay {
  id: number;
  adapterId: string;
  name: string;
  description: string;
  userAddress: string;
  isActive: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  deploymentUrl?: string | null;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  tokenDecimals?: number | null;
  config?: any;
  installedAt: string;
}

const MOCK_TOKEN = {
  address: "0xb9e8f815ADC8418DD28f35A7D147c98f725fa538",
  symbol: "MOCK",
  decimals: 18,
};

const FEATURED_ADAPTER: AdapterDisplay = {
  id: 0,
  adapterId: "mantle-transfer",
  name: "Demo: Mantle Transfer Agent",
  description: "Live demo adapter connected to an ElizaOS agent. Send tokens with ZK-policy protection on Mantle Sepolia.",
  userAddress: "0xf2750684eB187fF9f82e2F980f6233707eF5768C",
  isActive: true,
  isPublic: true,
  isFeatured: true,
  deploymentUrl: "/demo",
  tokenAddress: MOCK_TOKEN.address,
  tokenSymbol: MOCK_TOKEN.symbol,
  tokenDecimals: MOCK_TOKEN.decimals,
  config: {
    maxAmount: "100000000000000000000",
    timeWindow: { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 },
  },
  installedAt: new Date().toISOString(),
};

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected, connect, isConnecting } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: publicAdapters } = trpc.adapters.listPublic.useQuery();
  const { data: myAdapters } = trpc.adapters.listMine.useQuery(
    { userAddress: address || "" },
    { enabled: !!address }
  );
  const { data: activeAdapters } = trpc.adapters.listActive.useQuery();

  const getAdaptersForTab = (): AdapterDisplay[] => {
    let adapters: AdapterDisplay[] = [];
    
    switch (activeTab) {
      case "active":
        adapters = activeAdapters?.adapters || [];
        break;
      case "public":
        adapters = publicAdapters?.adapters || [];
        break;
      case "mine":
        adapters = myAdapters?.adapters || [];
        break;
    }

    if (activeTab === "public" || activeTab === "active") {
      const hasFeatured = adapters.some(a => a.isFeatured);
      if (!hasFeatured) {
        adapters = [FEATURED_ADAPTER, ...adapters];
      }
    }

    if (searchQuery) {
      adapters = adapters.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return adapters;
  };

  const adapters = getAdaptersForTab();

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      
      <div className="relative z-10">
        <div className="border-b border-purple">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-3 text-white">
                Opaque Adapters
              </h1>
              <p className="text-lg text-purple-muted mb-6">
                Browse and install automation adapters with ZK-policy protection.
                Each adapter runs with verifiable constraints that agents cannot see or manipulate.
              </p>

              {!isConnected && (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="px-6 py-3 btn-purple rounded-lg font-medium inline-flex items-center gap-2"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet to Get Started"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-purple sticky top-16 z-40 bg-black/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-0">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "active" ? "tab-active" : "tab-inactive"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("public")}
                className={`px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "public" ? "tab-active" : "tab-inactive"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "mine" ? "tab-active" : "tab-inactive"
                }`}
              >
                Mine
              </button>
              
              <div className="ml-auto py-2">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search adapters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 pr-4 py-2 input-purple rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {adapters.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2 text-white">No adapters found</h3>
              <p className="text-purple-muted text-sm">
                {activeTab === "mine" && !isConnected
                  ? "Connect your wallet to see your adapters"
                  : "Try adjusting your search or check back later"}
              </p>
              {activeTab === "mine" && isConnected && (
                <button
                  onClick={() => router.push("/adapters")}
                  className="mt-4 px-4 py-2 btn-purple-outline rounded-lg text-sm"
                >
                  Create New Adapter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-purple-muted">
                  {adapters.length} adapter{adapters.length !== 1 ? "s" : ""}
                </p>
                {activeTab === "mine" && (
                  <button
                    onClick={() => router.push("/adapters")}
                    className="px-4 py-2 btn-purple rounded-lg text-sm text-white"
                  >
                    + New Adapter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adapters.map((adapter) => (
                  <AdapterCard
                    key={adapter.id}
                    adapter={adapter}
                    onClick={() => router.push(`/adapters/${adapter.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdapterCard({
  adapter,
  onClick,
}: {
  adapter: AdapterDisplay;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all ${
        adapter.isFeatured ? "card-featured" : "card-purple"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {adapter.isFeatured && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-subtle text-purple-accent rounded">
              ✨ Featured
            </span>
          )}
          {adapter.isActive && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
        </div>
        {adapter.deploymentUrl && (
          <a
            href={adapter.deploymentUrl}
            onClick={(e) => {
              if (!adapter.deploymentUrl?.startsWith('http')) {
                // Internal route - let Next.js handle it
                e.stopPropagation();
              } else {
                // External URL - open in new tab
                e.stopPropagation();
              }
            }}
            target={adapter.deploymentUrl.startsWith('http') ? "_blank" : undefined}
            rel={adapter.deploymentUrl.startsWith('http') ? "noopener noreferrer" : undefined}
            className="text-xs text-purple-accent hover:underline"
          >
            Agent →
          </a>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{adapter.name}</h3>
      <p className="text-sm text-purple-muted mb-4 line-clamp-2">
        {adapter.description}
      </p>

      {adapter.tokenSymbol && (
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 text-xs card-purple rounded text-purple-accent">
            {adapter.tokenSymbol}
          </span>
          {adapter.tokenAddress && (
            <span className="text-xs text-purple-muted font-mono">
              {adapter.tokenAddress.slice(0, 6)}...{adapter.tokenAddress.slice(-4)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-purple-muted">
        <span>
          {adapter.userAddress.slice(0, 6)}...{adapter.userAddress.slice(-4)}
        </span>
        <span>{new Date(adapter.installedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
