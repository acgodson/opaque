"use client";

import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "../hooks/useWallet";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected, connect, isConnecting } = useWallet();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-800 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-2xl font-bold">
                <span className="text-white">0x</span>
                <span className="text-blue-500">Visor</span>
              </div>
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className={`text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Adapters
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push("/api-explorer")}
                className={`text-sm font-medium transition-colors ${
                  isActive("/api-explorer")
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                API Explorer
              </button>
              <a
                href="https://github.com/acgodson/0xvisor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Docs
              </a>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
