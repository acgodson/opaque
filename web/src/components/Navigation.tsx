"use client";

import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "../hooks/useWallet";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected, connect, isConnecting } = useWallet();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="sticky top-0 z-50 border-b border-purple backdrop-blur-sm bg-black/80">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/opaque_logo.png"
                alt="opaque"
                className="h-10 w-auto"
              />
            </button>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className={`text-sm font-medium transition-colors ${
                  isActive("/") && !pathname.startsWith("/adapters") && !pathname.startsWith("/dashboard")
                    ? "text-purple-accent"
                    : "text-purple-muted hover:text-purple-accent"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => router.push("/adapters")}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith("/adapters")
                    ? "text-purple-accent"
                    : "text-purple-muted hover:text-purple-accent"
                }`}
              >
                New Adapter
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-purple-accent"
                    : "text-purple-muted hover:text-purple-accent"
                }`}
              >
                Dashboard
              </button>
              <a
                href="https://github.com/acgodson/opaque"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-purple-muted hover:text-purple-accent transition-colors"
              >
                Docs
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 card-purple rounded-lg">
                  <span className="text-xs font-medium text-purple-accent">Mantle Sepolia</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 card-purple rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono text-purple-muted">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-4 py-2 btn-purple rounded-lg text-sm font-medium text-white"
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
