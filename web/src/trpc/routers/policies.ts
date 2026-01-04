import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { userPolicies } from "../../db";
import { eq, and, isNull } from "drizzle-orm";
import {
  getAllPolicyRules,
  getPolicyRule,
  policyCompiler,
  policyTemplates,
  serializeBigInt,
} from "@0xvisor/agent";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const policiesRouter = createTRPCRouter({
  // Get all policy rule definitions (stateless)
  getRules: baseProcedure.query(async () => {
    const rules = getAllPolicyRules().map((rule) => ({
      type: rule.type,
      name: rule.name,
      description: rule.description,
      defaultConfig: rule.defaultConfig,
    }));
    return { rules };
  }),

  // Compile policy DSL (stateless)
  compile: baseProcedure
    .input(z.any()) // Policy document can be any shape
    .mutation(async ({ input }) => {
      try {
        const compiled = policyCompiler.compile(input);

        if (!compiled.valid) {
          throw new Error(
            `Invalid policy document: ${compiled.errors?.join(", ")}`
          );
        }

        return {
          compiled: serializeBigInt({
            valid: compiled.valid,
            summary: compiled.summary,
            permission: compiled.permission,
            rules: compiled.rules,
          }),
        };
      } catch (error) {
        console.error("[ERROR] Policy compilation failed:", error);
        throw error;
      }
    }),

  // Get policy templates (stateless)
  getTemplates: baseProcedure
    .input(z.object({ adapterId: z.string().optional() }))
    .query(async ({ input }) => {
      // Filter templates if adapterId is provided (currently returns all)
      const templates = input.adapterId
        ? policyTemplates.filter(() => true)
        : policyTemplates;

      return { templates };
    }),

  // List user policies
  list: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      let policies;
      if (input.adapterId) {
        policies = await ctx.db
          .select()
          .from(userPolicies)
          .where(
            and(
              eq(userPolicies.userAddress, normalizedAddress),
              eq(userPolicies.adapterId, input.adapterId)
            )
          );
      } else {
        policies = await ctx.db
          .select()
          .from(userPolicies)
          .where(eq(userPolicies.userAddress, normalizedAddress));
      }

      const result = policies.map((p) => {
        const rule = getPolicyRule(p.policyType);
        return {
          id: p.id,
          policyType: p.policyType,
          name: rule?.name || p.policyType,
          description: rule?.description,
          isEnabled: p.isEnabled,
          config: p.config,
          adapterId: p.adapterId,
          createdAt: p.createdAt.toISOString(),
        };
      });

      return { policies: result };
    }),

  // Create or update policy
  set: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        policyType: z.string(),
        isEnabled: z.boolean().default(true),
        config: z.record(z.any()),
        adapterId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const rule = getPolicyRule(input.policyType);
        if (!rule) {
          throw new Error("Unknown policy type");
        }

        const normalizedAddress = input.userAddress.toLowerCase();

        // Check if policy already exists
        const existingRows = await ctx.db
          .select()
          .from(userPolicies)
          .where(
            and(
              eq(userPolicies.userAddress, normalizedAddress),
              eq(userPolicies.policyType, input.policyType),
              input.adapterId
                ? eq(userPolicies.adapterId, input.adapterId)
                : isNull(userPolicies.adapterId)
            )
          )
          .limit(1);
        const existing = existingRows[0] || null;

        if (existing) {
          // Update existing policy
          await ctx.db
            .update(userPolicies)
            .set({
              isEnabled: input.isEnabled,
              config: input.config,
            })
            .where(eq(userPolicies.id, existing.id));

          return { updated: true };
        } else {
          // Insert new policy
          const [inserted] = await ctx.db
            .insert(userPolicies)
            .values({
              userAddress: normalizedAddress,
              policyType: input.policyType,
              isEnabled: input.isEnabled,
              config: input.config,
              adapterId: input.adapterId || null,
            })
            .returning();

          return { policy: { id: inserted.id } };
        }
      } catch (error) {
        console.error("[ERROR] Policy creation/update failed:", error);
        throw error;
      }
    }),

  // Toggle policy enabled state
  toggle: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const existingRows = await ctx.db
        .select()
        .from(userPolicies)
        .where(eq(userPolicies.id, input.id))
        .limit(1);
      const existing = existingRows[0] || null;

      if (!existing) {
        throw new Error("Policy not found");
      }

      await ctx.db
        .update(userPolicies)
        .set({ isEnabled: !existing.isEnabled })
        .where(eq(userPolicies.id, input.id));

      return { isEnabled: !existing.isEnabled };
    }),
});
