"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "../../../trpc/client";
import { useWallet } from "../../../hooks/useWallet";
import { formatUnits } from "viem";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adapterId = params.adapterId as string;
  const { address } = useWallet();

  const isNumericId = /^\d+$/.test(adapterId);
  
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: adapterData, isLoading } = trpc.adapters.getById.useQuery(
    { id: adapterId },
    { enabled: !isNumericId }
  );

  const { data: proofHistory } = trpc.adapters.getProofHistory.useQuery(
    { adapterId: parseInt(adapterId) },
    { enabled: isNumericId }
  );

  const updateMutation = trpc.adapters.update.useMutation();

  if (adapterId === "0") {
    return <FeaturedAdapterDetail />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" />
        <div className="gradient-overlay" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-purple-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-purple-muted hover:text-purple-accent mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Adapters
          </button>

          <div className="card-purple rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              {adapterData?.adapter?.name || adapterId}
            </h1>
            <p className="text-purple-muted">
              {adapterData?.adapter?.description || "Adapter details"}
            </p>
          </div>

          {proofHistory && proofHistory.proofs.length > 0 && (
            <div className="card-purple rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Proof History</h2>
              <div className="space-y-3">
                {proofHistory.proofs.map((proof) => (
                  <ProofRow key={proof.id} proof={proof} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturedAdapterDetail() {
  const router = useRouter();
  
  const config = {
    maxAmount: "100000000000000000000",
    timeWindow: { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 },
  };

  const formatTimeWindow = () => {
    const tw = config.timeWindow;
    const days = tw.days.map((d: number) => DAY_NAMES[d]).join(", ");
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const startDate = new Date();
    startDate.setUTCHours(tw.startHour, 0, 0, 0);
    const endDate = new Date();
    endDate.setUTCHours(tw.endHour, 0, 0, 0);
    
    const startLocal = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endLocal = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    return { days, startLocal, endLocal, userTz };
  };

  const tw = formatTimeWindow();

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-purple-muted hover:text-purple-accent mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Adapters
          </button>

          <div className="card-featured rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-subtle text-purple-accent rounded">
                ✨ Featured
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Demo: Mantle Transfer Agent
            </h1>
            <p className="text-purple-muted mb-4">
              Live demo adapter connected to an ElizaOS agent. Send tokens with ZK-policy protection on Mantle Sepolia.
            </p>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 btn-purple rounded-lg text-sm text-white"
            >
              Open Agent Chat →
            </a>
          </div>

          <div className="card-purple rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Token</h2>
            <div className="flex items-center gap-4">
              <div className="px-3 py-2 bg-purple-subtle rounded-lg">
                <span className="text-purple-accent font-medium">MOCK</span>
              </div>
              <div className="text-sm text-purple-muted font-mono">
                0xb9e8f815ADC8418DD28f35A7D147c98f725fa538
              </div>
              <a
                href="https://sepolia.mantlescan.xyz/token/0xb9e8f815ADC8418DD28f35A7D147c98f725fa538"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-accent hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>

          <div className="card-purple rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Policy Rules</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-black/30 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-subtle rounded-lg text-purple-accent">
                  💰
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Max Amount per Transaction</div>
                  <div className="text-lg text-purple-accent">
                    {formatUnits(BigInt(config.maxAmount), 18)} MOCK
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-black/30 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-subtle rounded-lg text-purple-accent">
                  🕐
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Time Window</div>
                  <div className="text-purple-muted text-sm mt-1">
                    <div>Days: {tw.days}</div>
                    <div>Hours: {tw.startLocal} - {tw.endLocal} ({tw.userTz})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-purple rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Contract Addresses</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-purple-muted">Verifier</span>
                <a
                  href="https://sepolia.mantlescan.xyz/address/0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-purple-accent hover:underline"
                >
                  0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-purple-muted">Token</span>
                <a
                  href="https://sepolia.mantlescan.xyz/address/0xb9e8f815ADC8418DD28f35A7D147c98f725fa538"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-purple-accent hover:underline"
                >
                  0xb9e8f815ADC8418DD28f35A7D147c98f725fa538
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-purple-muted">Enclave</span>
                <span className="font-mono text-purple-muted">http://35.159.224.254:8001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofRow({ proof }: { proof: any }) {
  const { data: nullifierStatus } = trpc.adapters.checkNullifier.useQuery(
    { nullifier: proof.nullifier },
    { enabled: !!proof.nullifier }
  );

  const isUsed = nullifierStatus?.isUsed ?? proof.isUsed;

  return (
    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`px-2 py-1 text-xs rounded ${isUsed ? "status-used" : "status-success"}`}>
          {isUsed ? "Used" : "Valid"}
        </div>
        <div>
          <div className="text-sm text-white font-mono">
            {proof.nullifier.slice(0, 10)}...{proof.nullifier.slice(-8)}
          </div>
          <div className="text-xs text-purple-muted">
            {proof.amount} → {proof.recipient.slice(0, 8)}...
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-purple-muted">
          {new Date(proof.createdAt).toLocaleString()}
        </span>
        {proof.txHash && (
          <a
            href={`https://sepolia.mantlescan.xyz/tx/${proof.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-accent hover:underline"
          >
            View Tx →
          </a>
        )}
      </div>
    </div>
  );
}
