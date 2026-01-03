"use client";

import { useRouter } from "next/navigation";

export interface Adapter {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  comingSoon?: boolean;
}

interface AdapterCardProps {
  adapter: Adapter;
}

export function AdapterCard({ adapter }: AdapterCardProps) {
  const router = useRouter();

  const handleInstall = () => {
    if (adapter.comingSoon) return;
    router.push(`/adapters/${adapter.id}/policy`);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
          {adapter.name}
        </h3>
        {adapter.comingSoon && (
          <span className="px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-400 rounded">
            Coming Soon
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{adapter.description}</p>

      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          {adapter.category}
        </span>
      </div>

      <div className="mb-4 space-y-1.5">
        {adapter.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-zinc-400">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="line-clamp-1">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleInstall}
        disabled={adapter.comingSoon}
        className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {adapter.comingSoon ? "Coming Soon" : "Install Adapter"}
      </button>
    </div>
  );
}
