"use client";

import { SUPPORTED_TOKENS, PERIOD_OPTIONS, type PolicyFormState } from "../types/policy";

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
    onChange({
      ...value,
      limits: { ...value.limits, amount: e.target.value },
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      limits: { ...value.limits, currency: e.target.value },
    });
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      limits: {
        ...value.limits,
        period: e.target.value as "daily" | "weekly" | "monthly",
      },
    });
  };

  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === value.limits.period);
  const selectedToken = SUPPORTED_TOKENS.find((t) => t.symbol === value.limits.currency);

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
          placeholder="e.g., My Daily Transfer Policy"
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

      <div>
        <label className="block text-sm font-medium mb-3 text-white">How much can be transferred?</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <input
              type="text"
              value={value.limits.amount}
              onChange={handleAmountChange}
              placeholder="100"
              className="w-full px-4 py-3 input-purple rounded-lg text-center font-mono"
            />
            <div className="text-xs text-purple-muted mt-1 text-center">Amount</div>
          </div>

          <div>
            <select
              value={value.limits.currency}
              onChange={handleCurrencyChange}
              className="w-full px-4 py-3 input-purple rounded-lg cursor-pointer"
            >
              {SUPPORTED_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="text-xs text-purple-muted mt-1 text-center">Token</div>
          </div>

          <div>
            <select
              value={value.limits.period}
              onChange={handlePeriodChange}
              className="w-full px-4 py-3 input-purple rounded-lg cursor-pointer"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  per {period.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-purple-muted mt-1 text-center">Period</div>
          </div>
        </div>

        {value.limits.amount && selectedPeriod && (
          <div className="mt-4 p-4 bg-purple-subtle border border-purple rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-purple-accent text-lg">💡</span>
              <div className="text-sm text-purple-muted">
                This will allow up to{" "}
                <span className="font-semibold text-purple-accent">
                  {value.limits.amount} {selectedToken?.symbol || value.limits.currency}
                </span>{" "}
                to be transferred every {selectedPeriod.label.toLowerCase()}. The limit resets
                every {selectedPeriod.seconds / 3600} hours.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
