import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters, sessionAccounts } from "../../db";
import { eq, and } from "drizzle-orm";
import {
  getAdapter,
  getAdapterMetadata,
} from "@0xvisor/agent";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const adaptersRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    const metadata = getAdapterMetadata();
    return { adapters: metadata };
  }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const adapter = getAdapter(input.id);
      if (!adapter) {
        throw new Error("Adapter not found");
      }

      const { configSchema, proposeTransaction, validateConfig, ...metadata } =
        adapter;
      return { adapter: metadata };
    }),

  install: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string().min(1),
        config: z.record(z.any()),
        permissionId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const adapter = getAdapter(input.adapterId);
        if (!adapter) {
          throw new Error("Adapter not found");
        }

        if (!adapter.validateConfig(input.config)) {
          throw new Error("Invalid adapter configuration");
        }

        const normalizedAddress = input.userAddress.toLowerCase();

        const [inserted] = await ctx.db
          .insert(installedAdapters)
          .values({
            userAddress: normalizedAddress,
            adapterId: input.adapterId,
            config: input.config,
            permissionId: input.permissionId,
            isActive: true,
          })
          .returning();

        return {
          installed: {
            id: inserted.id,
            adapterId: inserted.adapterId,
            config: inserted.config,
            isActive: inserted.isActive,
            installedAt: inserted.installedAt.toISOString(),
          },
        };
      } catch (error) {
        console.error("[ERROR] Adapter install failed:", error);
        throw error;
      }
    }),

  listInstalled: baseProcedure
    .input(z.object({ userAddress: ethereumAddress }))
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      const installed = await ctx.db
        .select()
        .from(installedAdapters)
        .where(eq(installedAdapters.userAddress, normalizedAddress));

      const result = await Promise.all(
        installed.map(async (i) => {
          const adapter = getAdapter(i.adapterId);

          const sessionRows = await ctx.db
            .select()
            .from(sessionAccounts)
            .where(
              and(
                eq(sessionAccounts.userAddress, normalizedAddress),
                eq(sessionAccounts.adapterId, i.adapterId)
              )
            );

          return {
            id: i.id,
            adapterId: i.adapterId,
            name: adapter?.name || i.adapterId,
            config: i.config,
            permissionId: i.permissionId,
            isActive: i.isActive,
            lastRun: i.lastRun?.toISOString(),
            installedAt: i.installedAt.toISOString(),
            sessions: sessionRows.map((s) => ({
              sessionAccountId: s.sessionAccountId,
              address: s.address,
              createdAt: s.createdAt.toISOString(),
            })),
          };
        })
      );

      return { adapters: result };
    }),

  toggle: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const existingRows = await ctx.db
        .select()
        .from(installedAdapters)
        .where(eq(installedAdapters.id, input.id))
        .limit(1);
      const existing = existingRows[0] || null;

      if (!existing) {
        throw new Error("Installed adapter not found");
      }

      await ctx.db
        .update(installedAdapters)
        .set({ isActive: !existing.isActive })
        .where(eq(installedAdapters.id, input.id));

      return { isActive: !existing.isActive };
    }),
});
