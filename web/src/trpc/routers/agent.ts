import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { OPAQUE_VERIFIER_ADDRESS } from "../../lib/privy";

const ethereumAddress = z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
        message: "Invalid Ethereum address",
    });

export const agentRouter = createTRPCRouter({
    /**
     * Get configuration for an agent/user
     * Returns the OpaqueVerifier address and enclave URL
     */
    getConfig: baseProcedure
        .input(z.object({ userAddress: ethereumAddress }))
        .query(async ({ input }) => {
            return {
                verifierAddress: OPAQUE_VERIFIER_ADDRESS,
                enclaveUrl: process.env.ENCLAVE_URL || "http://localhost:8001",
            };
        }),
});
