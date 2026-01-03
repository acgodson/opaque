"use client";

import { useEffect, useState } from "react";
import { trpc } from "../trpc/client";

export function SignalStatusWidget() {
  const { data: signalsData, isLoading, refetch } = trpc.signals.fetchAll.useQuery(undefined, {
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const signals = signalsData?.signals;

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Signal Status</h3>
        <div className="text-sm text-zinc-400">Loading signals...</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Signals</h3>
        <button
          onClick={() => refetch()}
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {signals?.gas && (
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <div className="text-sm font-medium">Gas Price</div>
                <div className="text-xs text-zinc-400">Sepolia Network</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">{signals.gas.standard.toFixed(2)} gwei</div>
              <div className="text-xs text-zinc-500">Base: {(signals.gas.baseFee || 0).toFixed(4)}</div>
            </div>
          </div>
        )}

        {signals?.time && (
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <div className="text-sm font-medium">Current Time</div>
                <div className="text-xs text-zinc-400">
                  {signals.time.isWeekend ? "Weekend" : "Weekday"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {new Date(signals.time.now).toLocaleTimeString()}
              </div>
              <div className="text-xs text-zinc-500">
                Hour: {signals.time.hour}:00 UTC
              </div>
            </div>
          </div>
        )}

        {signals?.envio && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    signals.envio.envioConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <div className="text-sm font-medium">Envio Indexer</div>
                  <div className="text-xs text-zinc-400">On-chain Monitoring</div>
                </div>
              </div>
              <span
                className={`text-xs ${
                  signals.envio.envioConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                {signals.envio.envioConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Envio Stats */}
            {signals.envio.stats && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800/30 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-mono">{signals.envio.stats.totalRedemptions?.toString() || "0"}</div>
                  <div className="text-xs text-zinc-500">Redemptions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono">{signals.envio.stats.totalEnabled?.toString() || "0"}</div>
                  <div className="text-xs text-zinc-500">Granted</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono">{signals.envio.stats.totalDisabled?.toString() || "0"}</div>
                  <div className="text-xs text-zinc-500">Revoked</div>
                </div>
              </div>
            )}

            {signals.envio.alerts && signals.envio.alerts.length > 0 && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="text-red-400 font-medium text-sm">
                    {signals.envio.alerts.length} Active Alert{signals.envio.alerts.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="space-y-1">
                  {signals.envio.alerts.slice(0, 3).map((alert: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-300">
                      <span className="font-semibold uppercase">{alert.severity}:</span> {alert.message}
                    </div>
                  ))}
                  {signals.envio.alerts.length > 3 && (
                    <div className="text-xs text-red-400 mt-1">
                      +{signals.envio.alerts.length - 3} more alerts
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Events */}
            {signals.envio.recentRedemptions && signals.envio.recentRedemptions.length > 0 && (
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <div className="text-xs font-medium text-zinc-400 mb-2">
                  Recent Redemptions ({signals.envio.recentRedemptions.length})
                </div>
                <div className="space-y-1">
                  {signals.envio.recentRedemptions.slice(0, 3).map((redemption: any, idx: number) => (
                    <div key={idx} className="text-xs text-zinc-500 font-mono">
                      {redemption.rootDelegator?.slice(0, 8)}... →{" "}
                      {redemption.redeemer?.slice(0, 8)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
