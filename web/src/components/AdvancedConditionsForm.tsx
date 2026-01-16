"use client";

import { useState } from "react";
import type { PolicyFormState } from "../types/policy";

interface AdvancedConditionsFormProps {
  value: PolicyFormState;
  onChange: (value: PolicyFormState) => void;
}

export function AdvancedConditionsForm({ value, onChange }: AdvancedConditionsFormProps) {
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const handleTimeWindowToggle = (enabled: boolean) => {
    if (!enabled) {
      const { timeWindow, ...rest } = value;
      onChange(rest);
    } else {
      onChange({
        ...value,
        timeWindow: {
          enabled: true,
          startHour: 9,
          endHour: 17,
        },
      });
    }
  };

  const handleTimeChange = (field: "startHour" | "endHour", newValue: number) => {
    if (!value.timeWindow) return;

    onChange({
      ...value,
      timeWindow: {
        ...value.timeWindow,
        [field]: newValue,
      },
    });
  };

  const handleWhitelistToggle = (enabled: boolean) => {
    if (!enabled) {
      const { whitelist, ...rest } = value;
      onChange(rest);
    } else {
      onChange({
        ...value,
        whitelist: {
          enabled: true,
          addresses: [],
        },
      });
    }
  };

  const handleAddAddress = () => {
    if (!newAddress || !/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      alert("Invalid Ethereum address");
      return;
    }

    if (!value.whitelist) return;

    if (value.whitelist.addresses.length >= 4) {
      alert("Maximum 4 addresses supported (Merkle tree depth 2)");
      return;
    }

    onChange({
      ...value,
      whitelist: {
        ...value.whitelist,
        addresses: [...value.whitelist.addresses, newAddress.toLowerCase()],
      },
    });

    setNewAddress("");
    setShowAddAddress(false);
  };

  const handleRemoveAddress = (address: string) => {
    if (!value.whitelist) return;

    onChange({
      ...value,
      whitelist: {
        ...value.whitelist,
        addresses: value.whitelist.addresses.filter(a => a !== address),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="border border-purple rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-timewindow"
            checked={!!value.timeWindow?.enabled}
            onChange={(e) => handleTimeWindowToggle(e.target.checked)}
            className="w-4 h-4 rounded border-purple text-purple-primary focus:ring-purple-primary cursor-pointer accent-purple-500"
          />
          <label htmlFor="enable-timewindow" className="text-sm font-medium cursor-pointer text-white">
            Time window restrictions
          </label>
        </div>

        {value.timeWindow?.enabled && (
          <div className="ml-6 space-y-3">
            <p className="text-xs text-purple-muted mb-3">
              Transactions will only be allowed during these hours (UTC). The circuit checks the hour from the transaction timestamp.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-purple-muted mb-1">Start Hour (UTC)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={value.timeWindow.startHour}
                  onChange={(e) => handleTimeChange("startHour", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 input-purple rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-muted mb-1">End Hour (UTC)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={value.timeWindow.endHour}
                  onChange={(e) => handleTimeChange("endHour", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 input-purple rounded text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-purple-subtle border border-purple rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-purple-accent text-sm">💡</span>
                <div className="text-xs text-purple-muted">
                  {value.timeWindow.startHour <= value.timeWindow.endHour ? (
                    <>Allows transactions from {value.timeWindow.startHour}:00 to {value.timeWindow.endHour}:00 UTC</>
                  ) : (
                    <>Allows transactions from {value.timeWindow.startHour}:00 to {value.timeWindow.endHour}:00 UTC (wraps around midnight)</>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border border-purple rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-whitelist"
            checked={!!value.whitelist?.enabled}
            onChange={(e) => handleWhitelistToggle(e.target.checked)}
            className="w-4 h-4 rounded border-purple text-purple-primary focus:ring-purple-primary cursor-pointer accent-purple-500"
          />
          <label htmlFor="enable-whitelist" className="text-sm font-medium cursor-pointer text-white">
            Recipient whitelist
          </label>
        </div>

        {value.whitelist?.enabled && (
          <div className="ml-6 space-y-3">
            <p className="text-xs text-purple-muted">
              Only allow transfers to these addresses. Uses Merkle tree verification (max 4 addresses).
            </p>

            {!showAddAddress ? (
              <button
                onClick={() => setShowAddAddress(true)}
                disabled={value.whitelist.addresses.length >= 4}
                className="px-3 py-1.5 btn-purple text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Address
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 input-purple rounded text-sm font-mono"
                />
                <button
                  onClick={handleAddAddress}
                  className="px-3 py-2 btn-purple text-white text-xs rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddAddress(false);
                    setNewAddress("");
                  }}
                  className="px-3 py-2 btn-purple-outline text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            )}

            {value.whitelist.addresses.length > 0 ? (
              <div className="space-y-1">
                {value.whitelist.addresses.map((addr) => (
                  <div
                    key={addr}
                    className="flex items-center justify-between p-2 bg-black/30 rounded text-xs"
                  >
                    <span className="font-mono text-purple-muted">{addr}</span>
                    <button
                      onClick={() => handleRemoveAddress(addr)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-muted">No whitelisted addresses yet</p>
            )}

            {value.whitelist.addresses.length >= 4 && (
              <p className="text-xs text-yellow-400">
                Maximum addresses reached (4). Circuit uses Merkle tree depth 2.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
