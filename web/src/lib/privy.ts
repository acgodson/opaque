import { PrivyClient } from "@privy-io/node";

const appId = process.env.PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

if (!appId || !appSecret) {
    console.warn("Missing PRIVY_APP_ID or PRIVY_APP_SECRET environment variables");
}

// Privy client for user authentication and wallet management UI only
// Transaction signing is handled by ElizaOS agents with their own wallets
export const privy = new PrivyClient({ appId: appId || "", appSecret: appSecret || "" });

export const OPAQUE_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_OPAQUE_VERIFIER_ADDRESS || "";
export const ENCLAVE_URL = process.env.ENCLAVE_URL || "http://localhost:5001";
