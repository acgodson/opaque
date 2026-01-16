"use client";

import { useState } from "react";
import { trpc } from "../trpc/client";

interface ProofVerifierProps {
  proof: any;
  publicInputs: string[];
}

export function ProofVerifier({ proof, publicInputs }: ProofVerifierProps) {
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = trpc.verification.verify.useMutation({
    onSuccess: (data) => {
      setVerificationResult(data.verified);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setVerificationResult(null);
    },
  });

  const handleVerify = () => {
    setError(null);
    setVerificationResult(null);
    verifyMutation.mutate({ proof, publicInputs });
  };

  return (
    <div className="card-purple rounded-lg p-4">
      <h3 className="font-semibold mb-3 text-white">Off-Chain Verification</h3>
      
      <div className="space-y-3">
        <div className="text-sm text-purple-muted">
          Verify the proof server-side using Barretenberg
        </div>

        <button
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
          className="w-full px-4 py-2 btn-purple rounded-lg text-sm text-white disabled:opacity-50"
        >
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Proof'}
        </button>

        {verificationResult !== null && (
          <div className={`p-3 rounded-lg ${verificationResult ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              {verificationResult ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-400">Proof Valid ✓</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-400">Proof Invalid ✗</span>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="text-xs text-purple-muted">
          <p className="mb-1">Verification happens server-side:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>No blockchain interaction required</li>
            <li>Instant verification (no gas fees)</li>
            <li>Uses the same cryptography as on-chain verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
