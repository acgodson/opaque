"use client";

import { useState } from "react";
import { trpc } from "../trpc/client";

interface AdapterPlaygroundProps {
  adapterId: string;
  adapterName: string;
  userAddress: string;
}

export function AdapterPlayground({ adapterId, adapterName, userAddress }: AdapterPlaygroundProps) {
  const [recipient, setRecipient] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const executeMutation = trpc.execute.execute.useMutation();

  const handleExecute = async () => {
    if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    try {
      const result = await executeMutation.mutateAsync({
        userAddress: userAddress as `0x${string}`,
        adapterId,
        runtimeParams: {
          recipient: recipient as `0x${string}`,
        },
      });

      console.log("Execution result:", result);
    } catch (error) {
      console.error("Execution failed:", error);
    }
  };

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center justify-between text-sm"
      >
        <span className="font-medium">Test Execution</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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

      {isExpanded && (
        <div className="p-4 bg-zinc-900/30 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Recipient Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <div className="mt-1 text-xs text-zinc-500">
              Enter the address to send tokens to
            </div>
          </div>

          <button
            onClick={handleExecute}
            disabled={executeMutation.isPending || !recipient}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {executeMutation.isPending ? "Executing..." : "Execute Transfer"}
          </button>

          {executeMutation.data && (
            <div className={`p-3 rounded-lg text-sm ${
              executeMutation.data.success
                ? executeMutation.data.decision === "BLOCK"
                  ? "bg-yellow-900/20 border border-yellow-800"
                  : "bg-green-900/20 border border-green-800"
                : "bg-red-900/20 border border-red-800"
            }`}>
              <div className="font-medium mb-1">
                {executeMutation.data.success ? "Execution Result" : "Execution Failed"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Decision:</span>
                  <span className={`font-mono ${
                    executeMutation.data.decision === "ALLOW"
                      ? "text-green-400"
                      : executeMutation.data.decision === "BLOCK"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}>
                    {executeMutation.data.decision}
                  </span>
                </div>
                {executeMutation.data.reason && (
                  <div className="text-xs text-zinc-400">
                    Reason: {executeMutation.data.reason}
                  </div>
                )}
                {'txHash' in executeMutation.data && executeMutation.data.txHash && (
                  <div className="text-xs">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${executeMutation.data.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {executeMutation.data.txHash.slice(0, 10)}...{executeMutation.data.txHash.slice(-8)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {executeMutation.error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
              {executeMutation.error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
