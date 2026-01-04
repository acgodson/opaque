"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "../../../hooks/useWallet";
import { trpc } from "../../../trpc/client";

export default function AdapterAPIExplorer() {
  const params = useParams();
  const router = useRouter();
  const adapterId = params.adapterId as string;
  const { address, isConnected } = useWallet();

  const [sessionAccountId, setSessionAccountId] = useState<string>("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [executeResult, setExecuteResult] = useState<any>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  const installedAdapters = trpc.adapters.listInstalled.useQuery(
    { userAddress: address! },
    { enabled: !!address && isConnected }
  );

  const currentAdapter = installedAdapters.data?.adapters.find(
    (a) => a.adapterId === adapterId
  );

  const redemptionCount = trpc.envio.getUserRedemptionCount.useQuery(
    { userAddress: address! },
    { enabled: !!address && isConnected }
  );

  const handleLookupSession = async () => {
    if (!sessionAccountId.trim()) {
      setLookupError("Please enter a sessionAccountId");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setSessionData(null);

    try {
      const response = await fetch(`/api/session.getBySessionAccountId?input=${encodeURIComponent(JSON.stringify({ sessionAccountId: sessionAccountId.trim() }))}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.result || data;
      setSessionData(result);
    } catch (err: any) {
      setLookupError(err.message || "Failed to lookup session");
    } finally {
      setLookupLoading(false);
    }
  };

  const executeMutation = trpc.execute.execute.useMutation({
    onSuccess: (data) => {
      setExecuteResult(data);
      setExecuteError(null);
    },
    onError: (err) => {
      setExecuteError(err.message || "Failed to execute");
      setExecuteResult(null);
    },
  });

  const handleExecute = async () => {
    if (!address || !currentAdapter) return;

    setExecuteError(null);
    setExecuteResult(null);

    try {
      await executeMutation.mutateAsync({
        userAddress: address as `0x${string}`,
        adapterId,
        runtimeParams: {
          recipient: "0xcb3b302248cbee4f9b42c09c5adbc841c4fafc2f" as `0x${string}`,
        },
      });
    } catch (err: any) {
      setExecuteError(err.message || "Failed to execute");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 -mt-16">
        <div className="mb-6">
          <button
            onClick={() => router.push("/api-explorer")}
            className="text-zinc-400 hover:text-white mb-4 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to API Explorer
          </button>

          <h1 className="text-4xl font-bold mb-2">
            {adapterId.charAt(0).toUpperCase() + adapterId.slice(1)} API
          </h1>
          <p className="text-zinc-400">
            API documentation and testing for {adapterId} adapter
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400 mb-4">Please connect your wallet to view adapter API</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : !currentAdapter ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400 mb-4">Adapter not installed</p>
            <button
              onClick={() => router.push("/adapters")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Install Adapter
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {redemptionCount.data && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">On-Chain Redemption Stats</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <span className="text-zinc-400">Total Redemptions</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {redemptionCount.data.count}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Number of times your permissions have been redeemed on-chain
                  </p>
                  <a
                    href="/api-explorer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    View all Envio endpoints →
                  </a>
                </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Session Lookup</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Get smart account address by sessionAccountId
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    sessionAccountId
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sessionAccountId}
                      onChange={(e) => setSessionAccountId(e.target.value)}
                      placeholder="session_1234567890_abc123"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleLookupSession}
                      disabled={lookupLoading || !sessionAccountId.trim()}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                      {lookupLoading ? "Loading..." : "Lookup"}
                    </button>
                  </div>
                </div>

                {currentAdapter.sessions && currentAdapter.sessions.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Quick select:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentAdapter.sessions.map((session) => (
                        <button
                          key={session.sessionAccountId}
                          onClick={() => {
                            setSessionAccountId(session.sessionAccountId);
                            handleLookupSession();
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-mono text-zinc-300 transition-colors"
                        >
                          {session.sessionAccountId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {lookupError && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <div className="text-sm font-semibold text-red-400 mb-1">
                      Error
                    </div>
                    <div className="text-xs text-red-300">{lookupError}</div>
                  </div>
                )}

                {sessionData && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                      Session Data
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                      <pre className="text-green-300">
                        {JSON.stringify(sessionData, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <div className="text-sm font-semibold text-blue-400 mb-2">
                        Smart Account Address
                      </div>
                      <div className="font-mono text-lg text-blue-300">
                        {sessionData.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Execute Adapter</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Execute {adapterId} adapter transaction
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                    Endpoint
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300">
                    POST /api/execute.execute
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                    Request Body
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300">
                    <pre>
                      {JSON.stringify(
                        {
                          userAddress: address,
                          adapterId,
                          runtimeParams: {
                            recipient: "0xcb3b302248cbee4f9b42c09c5adbc841c4fafc2f",
                          },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {executeMutation.isPending
                    ? "Executing..."
                    : "Execute Transaction"}
                </button>

                {executeResult && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                      Response
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                      <pre className="text-green-300">
                        {JSON.stringify(executeResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {executeError && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <div className="text-sm font-semibold text-red-400 mb-1">
                      Error
                    </div>
                    <div className="text-xs text-red-300">
                      {executeError}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">cURL Examples</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                    Get Session by sessionAccountId
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-zinc-300">
                      {`curl -X POST https://your-domain.com/api/session.getBySessionAccountId \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionAccountId": "session_1234567890_abc123"
  }'`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                    Execute Adapter
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-zinc-300">
                      {`curl -X POST https://your-domain.com/api/execute.execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "userAddress": "${address}",
    "adapterId": "${adapterId}",
    "runtimeParams": {
      "recipient": "0xcb3b302248cbee4f9b42c09c5adbc841c4fafc2f"
    }
  }'`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

