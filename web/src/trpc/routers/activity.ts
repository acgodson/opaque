import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { executionLogs, eq, desc } from "../../db";
import { getAdapter } from "@opaque/agent";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const activityRouter = createTRPCRouter({
  // Get execution logs for user
  list: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      const logs = await ctx.db
        .select()
        .from(executionLogs)
        .where(eq(executionLogs.userAddress, normalizedAddress))
        .orderBy(desc(executionLogs.executedAt))
        .limit(input.limit);

      const result = logs.map((log: (typeof logs)[number]) => {
        const adapter = getAdapter(log.adapterId);
        return {
          id: log.id,
          adapterId: log.adapterId,
          adapterName: adapter?.name || log.adapterId,
          adapterIcon: adapter?.icon || "❓",
          decision: log.decision,
          reason: log.reason,
          txHash: log.txHash,
          timestamp: log.executedAt.toISOString(),
        };
      });

      return { activity: result };
    }),
});
