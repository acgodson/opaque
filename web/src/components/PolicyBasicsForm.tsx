"use client";

import type { PolicyFormState } from "../types/policy";

interface PolicyBasicsFormProps {
  value: PolicyFormState;
  onChange: (value: PolicyFormState) => void;
}

export function PolicyBasicsForm({ value, onChange }: PolicyBasicsFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, description: e.target.value });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    onChange({
      ...value,
      maxAmount: {
        ...value.maxAmount,
        limit: amount,
      },
    });
  };

  const handleEnableMaxAmount = (enabled: boolean) => {
    onChange({
      ...value,
      maxAmount: {
        ...value.maxAmount,
        enabled,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="policy-name" className="block text-sm font-medium mb-2 text-white">
          Policy Name
        </label>
        <input
          id="policy-name"
          type="text"
          value={value.name}
          onChange={handleNameChange}
          placeholder="e.g., My Transfer Policy"
          className="w-full px-4 py-3 input-purple rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="policy-description" className="block text-sm font-medium mb-2 text-white">
          Description (Optional)
        </label>
        <textarea
          id="policy-description"
          value={value.description || ""}
          onChange={handleDescriptionChange}
          placeholder="Brief description of this policy..."
          rows={2}
          className="w-full px-4 py-3 input-purple rounded-lg resize-none"
        />
      </div>

      <div className="border border-purple rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="enable-max-amount"
            checked={value.maxAmount.enabled}
            onChange={(e) => handleEnableMaxAmount(e.target.checked)}
            className="w-4 h-4 rounded border-purple text-purple-primary focus:ring-purple-primary cursor-pointer accent-purple-500"
          />
          <label htmlFor="enable-max-amount" className="text-sm font-medium cursor-pointer text-white">
            Maximum amount per transaction
          </label>
        </div>

        {value.maxAmount.enabled && (
          <div className="ml-6">
            <label className="block text-sm font-medium mb-2 text-white">
              Max Amount (MCK tokens)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.maxAmount.limit}
              onChange={handleAmountChange}
              placeholder="100"
              className="w-full px-4 py-3 input-purple rounded-lg font-mono"
            />
            <p className="text-xs text-purple-muted mt-2">
              Each transaction will be limited to this amount. The circuit will verify amounts in wei (1 MCK = 10^18 wei).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
