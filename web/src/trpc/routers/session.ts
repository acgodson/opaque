import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { sessionAccounts } from "../../db";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const sessionRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string().min(1, "Adapter ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const normalized = input.userAddress.toLowerCase();

        const existingRows = await ctx.db
          .select()
          .from(sessionAccounts)
          .where(
            and(
              eq(sessionAccounts.userAddress, normalized),
              eq(sessionAccounts.adapterId, input.adapterId)
            )
          )
          .limit(1);
        const existing = existingRows[0] || null;

        if (existing) {
          // Return existing session (key already provisioned in enclave)
          return {
            address: existing.address,
            userAddress: existing.userAddress,
            adapterId: existing.adapterId,
            createdAt: existing.createdAt.toISOString(),
          };
        }

        // Create session and provision key to enclave
        const sessionAccountId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);

        const deployParams: [owner: `0x${string}`, keyIds: string[], xValues: bigint[], yValues: bigint[]] = [
          account.address,
          [],
          [],
          []
        ];

        // Compute smart account address
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(process.env.RPC_URL),
        });

        const smartAccount = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          deployParams,
          deploySalt: "0x",
          signer: { account },
        });

        console.log(`[SESSION] Provisioning key to enclave for session: ${sessionAccountId}`);
        const provisionResult = await ctx.enclaveClient.provisionKey({
          sessionAccountId,
          privateKey,
          userAddress: normalized as `0x${string}`,
          adapterId: input.adapterId,
          deployParams,
        });

        if (!provisionResult.success) {
          throw new Error("Failed to provision key to enclave");
        }

        // Verify the smart account address matches
        if (provisionResult.sessionAccountAddress.toLowerCase() !== smartAccount.address.toLowerCase()) {
          throw new Error(
            `Smart account address mismatch: expected ${smartAccount.address}, got ${provisionResult.sessionAccountAddress}`
          );
        }

        const [inserted] = await ctx.db
          .insert(sessionAccounts)
          .values({
            sessionAccountId,
            address: smartAccount.address.toLowerCase(),
            userAddress: normalized,
            adapterId: input.adapterId,
            deployParams,
          })
          .returning();

        return {
          address: inserted.address,
          userAddress: inserted.userAddress,
          adapterId: inserted.adapterId,
          createdAt: inserted.createdAt.toISOString(),
        };
      } catch (error) {
        console.error("[ERROR] Failed to create session:", error);
        console.error("[ERROR] Error type:", typeof error);
        console.error("[ERROR] Error constructor:", error?.constructor?.name);
        
        let errorMessage = "Failed to create session";
        if (error instanceof Error) {
          errorMessage = error.message || error.name || errorMessage;
          if (error.stack) {
            console.error("[ERROR] Error stack:", error.stack);
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object") {
          try {
            const stringified = JSON.stringify(error, Object.getOwnPropertyNames(error));
            errorMessage = stringified !== "{}" ? stringified : String(error);
          } catch (e) {
            errorMessage = String(error);
          }
        }
        console.error("[ERROR] Final error message:", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage || "Failed to create session",
          cause: error,
        });
      }
    }),

  get: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      const sessionRows = await ctx.db
        .select()
        .from(sessionAccounts)
        .where(
          and(
            eq(sessionAccounts.userAddress, normalizedAddress),
            eq(sessionAccounts.adapterId, input.adapterId)
          )
        )
        .limit(1);
      const session = sessionRows[0] || null;

      if (!session) {
        throw new Error("Session not found");
      }

      return { sessionAddress: session.address };
    }),

  getBySessionAccountId: baseProcedure
    .input(
      z.object({
        sessionAccountId: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      const sessionRows = await ctx.db
        .select()
        .from(sessionAccounts)
        .where(eq(sessionAccounts.sessionAccountId, input.sessionAccountId))
        .limit(1);
      const session = sessionRows[0] || null;

      if (!session) {
        throw new Error("Session not found");
      }

      return {
        sessionAccountId: session.sessionAccountId,
        address: session.address,
        userAddress: session.userAddress,
        adapterId: session.adapterId,
        deployParams: session.deployParams,
        createdAt: session.createdAt.toISOString(),
      };
    }),
});
