import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters } from "../../db";
import { eq, and } from "drizzle-orm";
import {
  getAdapter,
  getAdapterMetadata,
} from "@0xvisor/agent/";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const adaptersRouter = createTRPCRouter({
  // Get all adapter metadata (no DB, just registry)
  list: baseProcedure.query(async () => {
    const metadata = getAdapterMetadata();
    return { adapters: metadata };
  }),

  // Get single adapter by ID (no DB, just registry)
  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const adapter = getAdapter(input.id);
      if (!adapter) {
        throw new Error("Adapter not found");
      }

      // Return metadata only (exclude internal functions)
      const { configSchema, proposeTransaction, validateConfig, ...metadata } =
        adapter;
      return { adapter: metadata };
    }),

  // Install adapter for user
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

        // Validate config using adapter's validation
        if (!adapter.validateConfig(input.config)) {
          throw new Error("Invalid adapter configuration");
        }

        const normalizedAddress = input.userAddress.toLowerCase();

        // Check if already installed
        const existing = await ctx.db.query.installedAdapters.findFirst({
          where: and(
            eq(installedAdapters.userAddress, normalizedAddress),
            eq(installedAdapters.adapterId, input.adapterId)
          ),
        });

        if (existing) {
          // Update existing adapter with new permission
          const [updated] = await ctx.db
            .update(installedAdapters)
            .set({
              config: input.config,
              permissionId: input.permissionId,
              isActive: true,
            })
            .where(eq(installedAdapters.id, existing.id))
            .returning();

          return {
            installed: {
              id: updated.id,
              adapterId: updated.adapterId,
              config: updated.config,
              isActive: updated.isActive,
              installedAt: updated.installedAt.toISOString(),
            },
          };
        }

        // Insert into DB
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

  // List installed adapters for user
  listInstalled: baseProcedure
    .input(z.object({ userAddress: ethereumAddress }))
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      const installed = await ctx.db.query.installedAdapters.findMany({
        where: eq(installedAdapters.userAddress, normalizedAddress),
      });

      const result = installed.map((i) => {
        const adapter = getAdapter(i.adapterId);
        return {
          id: i.id,
          adapterId: i.adapterId,
          name: adapter?.name || i.adapterId,
          icon: adapter?.icon || "❓",
          config: i.config,
          isActive: i.isActive,
          lastRun: i.lastRun?.toISOString(),
          installedAt: i.installedAt.toISOString(),
        };
      });

      return { adapters: result };
    }),

  // Toggle adapter active state
  toggle: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.query.installedAdapters.findFirst({
        where: eq(installedAdapters.id, input.id),
      });

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
