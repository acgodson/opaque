"use client";

import { useState } from "react";
import { AdapterCard, type Adapter } from "../../components/AdapterCard";
import { useWallet } from "../../hooks/useWallet";

const AVAILABLE_ADAPTERS: Adapter[] = [
  {
    id: "transfer-bot",
    name: "Transfer Bot",
    description: "Automate token transfers on a schedule with customizable policies for amount limits, time windows, and recipient whitelists",
    category: "DeFi Automation",
    features: [
      "Scheduled automatic transfers",
      "Customizable spending limits",
      "Time-based restrictions",
      "Recipient whitelist support",
      "Gas price optimization",
    ],
  },
  {
    id: "swap-bot",
    name: "Swap Bot",
    description: "Automated token swaps with price targets and slippage protection",
    category: "DeFi Automation",
    features: [
      "Automated token swaps",
      "Price target triggers",
      "Slippage protection",
      "Multi-DEX support",
    ],
    comingSoon: true,
  },
  {
    id: "dca-bot",
    name: "DCA Bot",
    description: "Dollar-cost averaging strategy for consistent token accumulation",
    category: "Investment Strategy",
    features: [
      "Recurring purchases",
      "Flexible schedules",
      "Multiple tokens support",
      "Portfolio rebalancing",
    ],
    comingSoon: true,
  },
  {
    id: "yield-optimizer",
    name: "Yield Optimizer",
    description: "Automatically move funds to highest-yielding protocols",
    category: "Yield Farming",
    features: [
      "Auto-compound rewards",
      "Protocol comparison",
      "Gas-efficient swaps",
      "Risk management",
    ],
    comingSoon: true,
  },
];

export default function AdaptersMarketplace() {
  const { isConnected, connect, isConnecting } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(AVAILABLE_ADAPTERS.map((a) => a.category)));

  const filteredAdapters = AVAILABLE_ADAPTERS.filter((adapter) => {
    const matchesSearch =
      adapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adapter.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || adapter.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-black">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-3">
              Automation Adapters
            </h1>
            <p className="text-lg text-zinc-400 mb-6">
              Install pre-built automation adapters with granular policy controls.
              Each adapter runs with MetaMask Advanced Permissions and 0xVisor safety policies.
            </p>

            {!isConnected && (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
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

      <div className="border-b border-zinc-800 bg-black sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Bar */}
            <div className="w-full md:w-96">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search adapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredAdapters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No adapters found</h3>
            <p className="text-zinc-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-400">
                {filteredAdapters.length} adapter{filteredAdapters.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdapters.map((adapter) => (
                <AdapterCard key={adapter.id} adapter={adapter} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h2 className="text-xl font-bold mb-2">Want to build your own adapter?</h2>
          <p className="text-zinc-400 text-sm mb-4 max-w-2xl mx-auto">
            0xVisor is open-source and extensible. Create custom automation adapters
            and share them with the community.
          </p>
          <a
            href="https://github.com/0xvisor/0xvisor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
          >
            View Documentation
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
