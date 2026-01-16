"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";

const ADAPTERS = [
  {
    id: "mantle-transfer",
    name: "Mantle Transfer",
    description: "Transfer tokens on Mantle with ZK-policy protection",
    icon: "💸",
    available: true,
  },
  {
    id: "uniswap-swap",
    name: "Uniswap Swap",
    description: "Swap tokens with policy-enforced limits",
    icon: "🔄",
    available: false,
  },
  {
    id: "aave-deposit",
    name: "Aave Deposit",
    description: "Deposit to Aave with spending controls",
    icon: "🏦",
    available: false,
  },
];

export default function AdaptersPage() {
  const router = useRouter();
  const { isConnected, connect, isConnecting } = useWallet();

  const handleAdapterSelect = (adapterId: string) => {
    router.push(`/adapters/${adapterId}/policy`);
  };

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="text-purple-muted hover:text-purple-accent mb-6 flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Adapter</h1>
          <p className="text-purple-muted">Select an adapter type to configure</p>
        </div>

        {!isConnected ? (
          <div className="card-purple rounded-lg p-8 text-center">
            <p className="text-purple-muted mb-4">Connect your wallet to create an adapter</p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-6 py-3 btn-purple rounded-lg font-medium text-white"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {ADAPTERS.map((adapter) => (
              <button
                key={adapter.id}
                onClick={() => adapter.available && handleAdapterSelect(adapter.id)}
                disabled={!adapter.available}
                className={`card-purple rounded-lg p-5 text-left transition-all ${
                  adapter.available 
                    ? "hover:border-purple-accent cursor-pointer" 
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{adapter.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{adapter.name}</h3>
                      {!adapter.available && (
                        <span className="text-xs px-2 py-0.5 bg-purple-accent/20 text-purple-accent rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-purple-muted mt-1">{adapter.description}</p>
                  </div>
                  {adapter.available && (
                    <svg className="w-5 h-5 text-purple-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
