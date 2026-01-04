"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";


interface Endpoint {
  path: string;
  method: "query" | "mutation";
  description: string;
  inputSchema: any;
  exampleInput: any;
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  session: [
    {
      path: "session.getBySessionAccountId",
      method: "query",
      description: "Get session account details by sessionAccountId",
      inputSchema: {
        sessionAccountId: "string (required)",
      },
      exampleInput: {
        sessionAccountId: "session_1234567890_abc123",
      },
    },
    {
      path: "session.get",
      method: "query",
      description: "Get session account address by userAddress and adapterId",
      inputSchema: {
        userAddress: "0x... (required)",
        adapterId: "string (required)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
        adapterId: "transfer-bot",
      },
    },
    {
      path: "session.create",
      method: "mutation",
      description: "Create a new session account and provision key to enclave",
      inputSchema: {
        userAddress: "0x... (required)",
        adapterId: "string (required)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
        adapterId: "transfer-bot",
      },
    },
  ],
  adapters: [
    {
      path: "adapters.list",
      method: "query",
      description: "List all available adapters",
      inputSchema: {},
      exampleInput: {},
    },
    {
      path: "adapters.listInstalled",
      method: "query",
      description: "List all installed adapters for a user",
      inputSchema: {
        userAddress: "0x... (required)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
      },
    },
    {
      path: "adapters.install",
      method: "mutation",
      description: "Install a new adapter instance",
      inputSchema: {
        userAddress: "0x... (required)",
        adapterId: "string (required)",
        config: "object (required)",
        permissionId: "number (optional)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
        adapterId: "transfer-bot",
        config: {
          tokenType: "USDC",
          amountPerTransfer: "0.1",
          maxAmountPerPeriod: "1.0",
          period: "daily",
        },
      },
    },
  ],
  execute: [
    {
      path: "execute.execute",
      method: "mutation",
      description: "Execute an adapter transaction",
      inputSchema: {
        userAddress: "0x... (required)",
        adapterId: "string (required)",
        runtimeParams: "object (optional)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
        adapterId: "transfer-bot",
        runtimeParams: {
          recipient: "0xcb3b302248cbee4f9b42c09c5adbc841c4fafc2f",
        },
      },
    },
  ],
  permissions: [
    {
      path: "permissions.list",
      method: "query",
      description: "List all permissions for a user",
      inputSchema: {
        userAddress: "0x... (required)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
      },
    },
  ],
  envio: [
    {
      path: "envio.getStats",
      method: "query",
      description: "Get global on-chain statistics (total redemptions, enabled, disabled)",
      inputSchema: {},
      exampleInput: {},
    },
    {
      path: "envio.getUserRedemptionCount",
      method: "query",
      description: "Get total number of times a user's permissions have been redeemed on-chain",
      inputSchema: {
        userAddress: "0x... (required)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
      },
    },
    {
      path: "envio.getUserRedemptions",
      method: "query",
      description: "Get detailed redemption history for a user",
      inputSchema: {
        userAddress: "0x... (required)",
        limit: "number (optional, default: 20, max: 100)",
      },
      exampleInput: {
        userAddress: "0xb87cb18bfd33f10740274db4380f1181f3d11f15",
        limit: 20,
      },
    },
    {
      path: "envio.getRecentRedemptions",
      method: "query",
      description: "Get recent redemptions across all users",
      inputSchema: {
        limit: "number (optional, default: 20, max: 100)",
      },
      exampleInput: {
        limit: 20,
      },
    },
    {
      path: "envio.getDelegationHistory",
      method: "query",
      description: "Get full history of a delegation (enabled, disabled, redemptions)",
      inputSchema: {
        delegationHash: "string (required)",
      },
      exampleInput: {
        delegationHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      },
    },
    {
      path: "envio.getSecurityAlerts",
      method: "query",
      description: "Get security alerts from on-chain anomaly detection",
      inputSchema: {
        isActive: "boolean (optional)",
        limit: "number (optional, default: 20, max: 100)",
      },
      exampleInput: {
        isActive: true,
        limit: 20,
      },
    },
  ],
};

export default function APIExplorer() {
  const { address, isConnected } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>("session");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Object.keys(ENDPOINTS);

  const handleEndpointSelect = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setInputValue(JSON.stringify(endpoint.exampleInput, null, 2));
    setResponse(null);
    setError(null);
  };

  const handleExecute = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const input = JSON.parse(inputValue);
      const [router, method] = selectedEndpoint.path.split(".");
      const isQuery = selectedEndpoint.method === "query";
      
      const url = isQuery 
        ? `/api/${router}.${method}?input=${encodeURIComponent(JSON.stringify(input))}`
        : `/api/${router}.${method}`;
      
      const response = await fetch(url, {
        method: isQuery ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(isQuery ? {} : { body: JSON.stringify(input) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.result || data;

      if (!result) {
        throw new Error(`Endpoint ${selectedEndpoint.path} not found`);
      }

      setResponse(result);
    } catch (err: any) {
      setError(err.message || "Failed to execute request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">API Explorer</h1>
          <p className="text-zinc-400">
            Interactive API documentation and testing for 0xVisor endpoints
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Endpoints</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedEndpoint(null);
                        setResponse(null);
                        setError(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                    {selectedCategory === category && (
                      <div className="mt-2 ml-4 space-y-1">
                        {ENDPOINTS[category].map((endpoint) => (
                          <button
                            key={endpoint.path}
                            onClick={() => handleEndpointSelect(endpoint)}
                            className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                              selectedEndpoint?.path === endpoint.path
                                ? "bg-blue-700 text-white"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {endpoint.path.split(".")[1]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedEndpoint ? (
              <>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        {selectedEndpoint.path}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {selectedEndpoint.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedEndpoint.method === "query"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {selectedEndpoint.method.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                      Input Schema
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs">
                      <pre className="text-zinc-300">
                        {JSON.stringify(selectedEndpoint.inputSchema, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-zinc-300">
                        Request Body
                      </h3>
                      <button
                        onClick={() =>
                          setInputValue(
                            JSON.stringify(selectedEndpoint.exampleInput, null, 2)
                          )
                        }
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Reset to example
                      </button>
                    </div>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter JSON input..."
                    />
                  </div>

                  <button
                    onClick={handleExecute}
                    disabled={loading || !inputValue}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                  >
                    {loading ? "Executing..." : "Execute Request"}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="text-sm font-semibold text-red-400 mb-1">
                        Error
                      </div>
                      <div className="text-xs text-red-300 font-mono">
                        {error}
                      </div>
                    </div>
                  )}

                  {response && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2 text-zinc-300">
                        Response
                      </h3>
                      <div className="bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs overflow-x-auto">
                        <pre className="text-green-300">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">cURL Example</h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-zinc-300">
                      {`curl -X POST https://your-domain.com/api/${selectedEndpoint.path} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(selectedEndpoint.exampleInput)}'`}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                <p className="text-zinc-400">
                  Select an endpoint from the sidebar to view documentation and
                  test it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

