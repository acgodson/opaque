import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters, executionLogs } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { getAdapter, type ProposedTransaction, policyEngine } from "@opaque/agent";
import { OPAQUE_VERIFIER_ADDRESS } from "../../lib/privy";
import { enclaveClient } from "../../lib/enclave-client";

const ethereumAddress = z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
        message: "Invalid Ethereum address",
    });

export const agentRouter = createTRPCRouter({
    // REMOVED: execute mutation - ElizaOS agents handle execution directly
    // REMOVED: submit mutation - ElizaOS agents handle submission directly

    /**
     * Prepare endpoint - Generates ZK proof for a proposed transaction
     * Used for testing and by ElizaOS agents to get proof data
     * ElizaOS agents will handle the actual transaction submission
     */
    prepare: baseProcedure
        .input(
            z.object({
                userAddress: ethereumAddress,
                installationId: z.number().int().positive(),
                runtimeParams: z
                    .object({
                        recipient: ethereumAddress.optional(),
                        amount: z.string().optional(),
                    })
                    .optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const normalizedAddress = input.userAddress.toLowerCase();
                console.log(`\n=== Agent Prepare Request ===`);
                console.log(`User: ${normalizedAddress}`);
                console.log(`Installation: ${input.installationId}`);

                const installedRows = await ctx.db
                    .select()
                    .from(installedAdapters)
                    .where(
                        and(
                            eq(installedAdapters.id, input.installationId),
                            eq(installedAdapters.userAddress, normalizedAddress),
                            eq(installedAdapters.isActive, true)
                        )
                    )
                    .limit(1);

                const installed = installedRows[0] || null;
                if (!installed) {
                    throw new Error("Installation not found or inactive");
                }

                const adapter = getAdapter(installed.adapterId);
                if (!adapter) {
                    throw new Error("Adapter definition not found");
                }

                const config = installed.config as Record<string, any>;
                const runtimeParams = input.runtimeParams
                    ? {
                        ...input.runtimeParams,
                        recipient: input.runtimeParams.recipient as `0x${string}` | undefined,
                    }
                    : undefined;

                const proposedTx: ProposedTransaction | null = await adapter.proposeTransaction({
                    userAddress: normalizedAddress as `0x${string}`,
                    config,
                    runtimeParams,
                });

                if (!proposedTx) {
                    throw new Error("No transaction proposed by adapter");
                }

                const lastExecutionRows = await ctx.db
                    .select()
                    .from(executionLogs)
                    .where(
                        and(
                            eq(executionLogs.userAddress, normalizedAddress),
                            eq(executionLogs.adapterId, installed.adapterId)
                        )
                    )
                    .orderBy(desc(executionLogs.executedAt))
                    .limit(1);
                const lastExecution = lastExecutionRows[0]?.executedAt;

                const policyConfig = await policyEngine.prepareConfig(
                    normalizedAddress as `0x${string}`,
                    installed.adapterId,
                    proposedTx,
                    { db: ctx.db, lastExecutionTime: lastExecution }
                );

                await enclaveClient.storePolicyConfig(normalizedAddress, input.installationId, policyConfig);

                const proofResult = await enclaveClient.generateProof({
                    userAddress: normalizedAddress,
                    installationId: input.installationId,
                    txData: {
                        amount: proposedTx.value ? proposedTx.value.toString() : "0",
                        recipient: proposedTx.target,
                        timestamp: Math.floor(Date.now() / 1000),
                        userAddress: normalizedAddress,
                    },
                });

                if (!proofResult.success) {
                    throw new Error("Failed to generate proof");
                }

                return {
                    success: true,
                    data: {
                        proof: proofResult.proof,
                        publicInputs: proofResult.publicInputs,
                        verifierAddress: OPAQUE_VERIFIER_ADDRESS,
                        target: proposedTx.target,
                        callData: proposedTx.callData,
                        description: proposedTx.description,
                        value: proposedTx.value.toString(),
                    }
                };
            } catch (error) {
                console.error("[Agent Prepare Error]", error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }),

    /**
     * Get configuration for an agent/user
     * Returns the OpaqueVerifier address that agents should interact with
     */
    getConfig: baseProcedure
        .input(z.object({ userAddress: ethereumAddress }))
        .query(async ({ input }) => {
            return {
                verifierAddress: OPAQUE_VERIFIER_ADDRESS,
                enclaveUrl: process.env.ENCLAVE_URL || "http://localhost:5001",
            };
        }),
});
