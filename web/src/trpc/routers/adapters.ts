import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters, proofLogs, eq, and, desc } from "../../db";
import { getAdapter, getAdapterMetadata } from "@opaque/agent";
import { createPublicClient, http } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

const VERIFIER_ADDRESS = "0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361";

const publicClient = createPublicClient({
  chain: mantleSepoliaTestnet,
  transport: http(),
});

const verifierAbi = [
  {
    inputs: [{ name: "nullifier", type: "bytes32" }],
    name: "usedNullifiers",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

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
      const { configSchema, proposeTransaction, validateConfig, ...metadata } = adapter;
      return { adapter: metadata };
    }),

  listPublic: baseProcedure.query(async ({ ctx }) => {
    const adapters = await ctx.db
      .select()
      .from(installedAdapters)
      .where(eq(installedAdapters.isPublic, true))
      .orderBy(desc(installedAdapters.installedAt));

    return {
      adapters: adapters.map((a) => ({
        id: a.id,
        adapterId: a.adapterId,
        name: a.adapterId,
        description: "",
        userAddress: a.userAddress,
        isActive: a.isActive,
        isPublic: a.isPublic,
        isFeatured: a.isFeatured,
        deploymentUrl: a.deploymentUrl,
        tokenAddress: a.tokenAddress,
        tokenSymbol: a.tokenSymbol,
        tokenDecimals: a.tokenDecimals,
        config: a.config,
        installedAt: a.installedAt.toISOString(),
      })),
    };
  }),

  listMine: baseProcedure
    .input(z.object({ userAddress: ethereumAddress }))
    .query(async ({ input, ctx }) => {
      const adapters = await ctx.db
        .select()
        .from(installedAdapters)
        .where(eq(installedAdapters.userAddress, input.userAddress))
        .orderBy(desc(installedAdapters.installedAt));

      return {
        adapters: adapters.map((a) => ({
          id: a.id,
          adapterId: a.adapterId,
          name: a.adapterId,
          description: "",
          userAddress: a.userAddress,
          isActive: a.isActive,
          isPublic: a.isPublic,
          isFeatured: a.isFeatured,
          deploymentUrl: a.deploymentUrl,
          tokenAddress: a.tokenAddress,
          tokenSymbol: a.tokenSymbol,
          tokenDecimals: a.tokenDecimals,
          config: a.config,
          installedAt: a.installedAt.toISOString(),
        })),
      };
    }),

  listActive: baseProcedure.query(async ({ ctx }) => {
    const adapters = await ctx.db
      .select()
      .from(installedAdapters)
      .where(eq(installedAdapters.isActive, true))
      .orderBy(desc(installedAdapters.installedAt));

    return {
      adapters: adapters.map((a) => ({
        id: a.id,
        adapterId: a.adapterId,
        name: a.adapterId,
        description: "",
        userAddress: a.userAddress,
        isActive: a.isActive,
        isPublic: a.isPublic,
        isFeatured: a.isFeatured,
        deploymentUrl: a.deploymentUrl,
        tokenAddress: a.tokenAddress,
        tokenSymbol: a.tokenSymbol,
        tokenDecimals: a.tokenDecimals,
        config: a.config,
        installedAt: a.installedAt.toISOString(),
      })),
    };
  }),

  install: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string().min(1),
        config: z.record(z.any()),
        isPublic: z.boolean().optional().default(false),
        deploymentUrl: z.string().optional(),
        tokenAddress: z.string().optional(),
        tokenSymbol: z.string().optional(),
        tokenDecimals: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const adapter = getAdapter(input.adapterId);
      if (!adapter) {
        throw new Error("Adapter not found");
      }

      if (!adapter.validateConfig(input.config)) {
        throw new Error("Invalid adapter configuration");
      }

      const [inserted] = await ctx.db
        .insert(installedAdapters)
        .values({
          userAddress: input.userAddress,
          adapterId: input.adapterId,
          config: input.config,
          isActive: true,
          isPublic: input.isPublic,
          deploymentUrl: input.deploymentUrl,
          tokenAddress: input.tokenAddress,
          tokenSymbol: input.tokenSymbol,
          tokenDecimals: input.tokenDecimals,
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
    }),

  listInstalled: baseProcedure
    .input(z.object({ userAddress: ethereumAddress }))
    .query(async ({ input, ctx }) => {
      const installed = await ctx.db
        .select()
        .from(installedAdapters)
        .where(eq(installedAdapters.userAddress, input.userAddress));

      const result = await Promise.all(
        installed.map(async (i) => {
          const adapter = getAdapter(i.adapterId);
          return {
            id: i.id,
            adapterId: i.adapterId,
            name: adapter?.name || i.adapterId,
            config: i.config,
            isActive: i.isActive,
            lastRun: i.lastRun?.toISOString(),
            installedAt: i.installedAt.toISOString(),
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

  update: baseProcedure
    .input(
      z.object({
        id: z.number(),
        isPublic: z.boolean().optional(),
        deploymentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updates: Record<string, any> = {};
      if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
      if (input.deploymentUrl !== undefined) updates.deploymentUrl = input.deploymentUrl;

      await ctx.db
        .update(installedAdapters)
        .set(updates)
        .where(eq(installedAdapters.id, input.id));

      return { success: true };
    }),

  checkNullifier: baseProcedure
    .input(z.object({ nullifier: z.string() }))
    .query(async ({ input }) => {
      try {
        const isUsed = await publicClient.readContract({
          address: VERIFIER_ADDRESS,
          abi: verifierAbi,
          functionName: "usedNullifiers",
          args: [input.nullifier as `0x${string}`],
        });
        return { nullifier: input.nullifier, isUsed };
      } catch (error) {
        return { nullifier: input.nullifier, isUsed: false, error: "Failed to check" };
      }
    }),

  logProof: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.number(),
        nullifier: z.string(),
        txHash: z.string().optional(),
        amount: z.string(),
        recipient: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [inserted] = await ctx.db
        .insert(proofLogs)
        .values({
          userAddress: input.userAddress,
          adapterId: input.adapterId,
          nullifier: input.nullifier,
          txHash: input.txHash,
          amount: input.amount,
          recipient: input.recipient,
          isUsed: !!input.txHash,
        })
        .returning();

      return { id: inserted.id };
    }),

  getProofHistory: baseProcedure
    .input(z.object({ adapterId: z.number() }))
    .query(async ({ input, ctx }) => {
      const proofs = await ctx.db
        .select()
        .from(proofLogs)
        .where(eq(proofLogs.adapterId, input.adapterId))
        .orderBy(desc(proofLogs.createdAt));

      return {
        proofs: proofs.map((p) => ({
          id: p.id,
          nullifier: p.nullifier,
          txHash: p.txHash,
          amount: p.amount,
          recipient: p.recipient,
          isUsed: p.isUsed,
          createdAt: p.createdAt.toISOString(),
        })),
      };
    }),

  lookupToken: baseProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      try {
        const erc20Abi = [
          { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
          { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
          { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
        ] as const;

        const [symbol, decimals, name] = await Promise.all([
          publicClient.readContract({
            address: input.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "symbol",
          }),
          publicClient.readContract({
            address: input.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: input.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "name",
          }).catch(() => "Unknown"),
        ]);

        return { address: input.address, symbol, decimals, name };
      } catch (error) {
        throw new Error("Failed to lookup token");
      }
    }),
});
