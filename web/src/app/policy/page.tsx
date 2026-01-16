"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page redirects to the proper adapter installation flow
export default function PolicyBuilderPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to adapters page - the proper entry point for creating adapters
    router.replace("/adapters");
  }, [router]);

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-purple-muted text-sm">Redirecting...</div>
      </div>
    </div>
  );
}
