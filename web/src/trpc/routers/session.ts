import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { sessionAccounts } from "../../db";
import { eq, and } from "drizzle-orm";
import { sessionManager } from "@0xvisor/agent/";

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

        const existing = await ctx.db.query.sessionAccounts.findFirst({
          where: and(
            eq(sessionAccounts.userAddress, normalized),
            eq(sessionAccounts.adapterId, input.adapterId)
          ),
        });

        if (existing) {
          return {
            address: existing.address,
            userAddress: existing.userAddress,
            adapterId: existing.adapterId,
            createdAt: existing.createdAt.toISOString(),
          };
        }

        const result = await sessionManager.createSession(
          normalized as `0x${string}`,
          input.adapterId
        );

        const [inserted] = await ctx.db
          .insert(sessionAccounts)
          .values({
            address: result.address.toLowerCase(),
            userAddress: result.userAddress,
            adapterId: result.adapterId,
            encryptedPrivateKey: result.encryptedPrivateKey,
            deployParams: result.deployParams,
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
        throw error;
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

      const session = await ctx.db.query.sessionAccounts.findFirst({
        where: and(
          eq(sessionAccounts.userAddress, normalizedAddress),
          eq(sessionAccounts.adapterId, input.adapterId)
        ),
      });

      if (!session) {
        throw new Error("Session not found");
      }

      return { sessionAddress: session.address };
    }),
});
