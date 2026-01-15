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
    <div className="card-purple rounded-lg p-4 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-accent transition-colors">
          {adapter.name}
        </h3>
        {adapter.comingSoon && (
          <span className="px-2 py-1 text-xs font-medium bg-purple-subtle text-purple-muted rounded">
            Coming Soon
          </span>
        )}
      </div>
      <p className="text-sm text-purple-muted mb-3 line-clamp-2">{adapter.description}</p>

      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-subtle text-purple-accent rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-accent"></span>
          {adapter.category}
        </span>
      </div>

      <div className="mb-4 space-y-1.5">
        {adapter.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-purple-muted">
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
        className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-all ${
          adapter.comingSoon
            ? "bg-purple-subtle text-purple-muted cursor-not-allowed"
            : "btn-purple text-white"
        }`}
      >
        {adapter.comingSoon ? "Coming Soon" : "Install Adapter"}
      </button>
    </div>
  );
}
