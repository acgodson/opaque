"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";

export default function NewAdapterPage() {
  const router = useRouter();
  const { isConnected, connect, isConnecting } = useWallet();

  useEffect(() => {
    if (isConnected) {
      router.push("/adapters/mantle-transfer/policy");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-white">Create New Adapter</h1>
          <p className="text-purple-muted mb-8">
            Connect your wallet to configure a new Mantle Transfer adapter with ZK-policy protection.
          </p>

          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-6 py-3 btn-purple rounded-lg font-medium text-white inline-flex items-center gap-2"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <div className="text-purple-muted">Redirecting to policy builder...</div>
          )}
        </div>
      </div>
    </div>
  );
}
