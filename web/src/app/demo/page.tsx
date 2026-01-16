"use client";

import { useRouter } from "next/navigation";

export default function DemoAgentPage() {
  const router = useRouter();
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL;

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />

      <div className="relative z-10">
        <div className="border-b border-purple">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-purple-muted hover:text-purple-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Adapters
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-400">Agent Active</span>
                </div>
                <a
                  href={agentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-accent hover:underline"
                >
                  Open in New Tab →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-2">
              Demo: Mantle Transfer Agent
            </h1>
            <p className="text-purple-muted text-sm">
              Chat with the agent to send MCK tokens. Try: "Send 50 MCK to 0x08dEa93A4B7A6Ae45B3bCfC03D92ce6B33d82ce6"
            </p>
          </div>

          <div className="card-purple rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
            <iframe
              src={agentUrl}
              className="w-full h-full border-0"
              title="Opaque Agent"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              allow="clipboard-write"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
