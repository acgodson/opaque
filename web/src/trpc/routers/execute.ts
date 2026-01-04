import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters, permissions, sessionAccounts, executionLogs, userPolicies } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import {
  executor,
  getAdapter,
  policyEngine,
  type ProposedTransaction,
} from "@0xvisor/agent";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const executeRouter = createTRPCRouter({
  execute: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        adapterId: z.string().min(1),
        runtimeParams: z
          .object({
            recipient: ethereumAddress.optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const normalizedAddress = input.userAddress.toLowerCase();

        console.log(`\n=== Execute Request ===`);
        console.log(`User: ${normalizedAddress}`);
        console.log(`Adapter: ${input.adapterId}`);
        console.log(`Runtime params:`, input.runtimeParams);

        const installedRows = await ctx.db
          .select()
          .from(installedAdapters)
          .where(
            and(
              eq(installedAdapters.userAddress, normalizedAddress),
              eq(installedAdapters.adapterId, input.adapterId),
              eq(installedAdapters.isActive, true)
            )
          )
          .limit(1);
        const installed = installedRows[0] || null;

        if (!installed) {
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "Adapter not installed or inactive",
          };
        }

        // 2. Get adapter definition from registry
        const adapter = getAdapter(input.adapterId);
        if (!adapter) {
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "Adapter definition not found",
          };
        }

        const permissionRows = installed.permissionId
          ? await ctx.db
              .select()
              .from(permissions)
              .where(eq(permissions.id, installed.permissionId))
              .limit(1)
          : [];
        const permission = permissionRows[0] || null;

        if (!permission) {
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "No permission found for this adapter",
          };
        }

        const sessionRows = await ctx.db
          .select({
            id: sessionAccounts.id,
            sessionAccountId: sessionAccounts.sessionAccountId,
            address: sessionAccounts.address,
            userAddress: sessionAccounts.userAddress,
            adapterId: sessionAccounts.adapterId,
            deployParams: sessionAccounts.deployParams,
            createdAt: sessionAccounts.createdAt,
          })
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
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "Session not found",
          };
        }

        if (!session.sessionAccountId) {
          console.error("[ERROR] Session missing sessionAccountId:", {
            sessionId: session.id,
            address: session.address,
            sessionKeys: Object.keys(session),
          });
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "Session missing sessionAccountId",
          };
        }

        console.log("[DEBUG] Session object:", {
          id: session.id,
          address: session.address,
          sessionAccountId: session.sessionAccountId,
          allKeys: Object.keys(session),
        });

        // 5. Propose transaction from adapter
        const config = installed.config as Record<string, any>;
        const permissionData = permission.delegationData;

        // Ensure runtimeParams has proper type
        const runtimeParams = input.runtimeParams
          ? {
              ...input.runtimeParams,
              recipient: input.runtimeParams.recipient as `0x${string}` | undefined,
            }
          : undefined;

        console.log("Proposing transaction...");
        const proposedTx: ProposedTransaction | null = await adapter.proposeTransaction({
          userAddress: normalizedAddress as `0x${string}`,
          config,
          permissionData,
          runtimeParams,
        });

        if (!proposedTx) {
          console.log("Adapter proposed no transaction");
          return {
            success: true,
            decision: "ALLOW" as const,
            reason: "No transaction needed",
          };
        }

        console.log(`Proposed: ${proposedTx.description}`);

        const lastExecutionRows = await ctx.db
          .select()
          .from(executionLogs)
          .where(
            and(
              eq(executionLogs.userAddress, normalizedAddress),
              eq(executionLogs.adapterId, input.adapterId)
            )
          )
          .orderBy(desc(executionLogs.executedAt))
          .limit(1);
        const lastExecution = lastExecutionRows[0] || null;

        console.log("Evaluating policies...");
        const evaluation = await policyEngine.evaluate(
          normalizedAddress as `0x${string}`,
          input.adapterId,
          proposedTx,
          {
            db: ctx.db,
            lastExecutionTime: lastExecution?.executedAt,
          }
        );

        // 7. Log execution to DB
        const serializeBigInt = (obj: any): any => {
          return JSON.parse(
            JSON.stringify(obj, (_, value) =>
              typeof value === "bigint" ? value.toString() : value
            )
          );
        };

        const [executionLog] = await ctx.db.insert(executionLogs).values({
          userAddress: normalizedAddress,
          adapterId: input.adapterId,
          proposedTx: serializeBigInt(proposedTx),
          decision: evaluation.allowed ? "ALLOW" : "BLOCK",
          reason: evaluation.blockingReason || "All policies passed",
          policyResults: evaluation.decisions,
        }).returning();

        // 8. If blocked, return early
        if (!evaluation.allowed) {
          console.log(`BLOCKED: ${evaluation.blockingReason}`);
          return {
            success: true,
            decision: "BLOCK" as const,
            reason: evaluation.blockingReason || "Policy blocked",
          };
        }

        console.log("All policies passed - ALLOW");

        const userPoliciesRows = await ctx.db
          .select()
          .from(userPolicies)
          .where(
            and(
              eq(userPolicies.userAddress, normalizedAddress),
              eq(userPolicies.isEnabled, true)
            )
          );

        const result = await executor.executeAdapter({
          userAddress: normalizedAddress as `0x${string}`,
          adapter,
          session: {
            address: session.address as `0x${string}`,
            sessionAccountId: session.sessionAccountId,
            deployParams: session.deployParams as any,
          },
          installedAdapterData: {
            config,
            permissionId: installed.permissionId || undefined,
          },
          runtimeParams: input.runtimeParams,
          permissionDelegationData: permissionData,
          policyRules: userPoliciesRows.map((p) => ({
            type: p.policyType,
            isEnabled: p.isEnabled,
            config: typeof p.config === 'string' ? JSON.parse(p.config) : p.config,
          })),
          signals: {},
          lastExecutionTime: lastExecution?.executedAt,
          enclaveClient: ctx.enclaveClient,
        });

        // 10. Update execution log with txHash if successful
        if (result.success && result.txHash) {
          await ctx.db
            .update(executionLogs)
            .set({ txHash: result.txHash })
            .where(eq(executionLogs.id, executionLog.id));
        }

        // 11. Update lastRun timestamp
        await ctx.db
          .update(installedAdapters)
          .set({ lastRun: new Date() })
          .where(eq(installedAdapters.id, installed.id));

        console.log(`Execution complete: ${result.decision}`);
        if (result.txHash) {
          console.log(`txHash: ${result.txHash}`);
        }

        return result;
      } catch (error) {
        console.error("[ERROR] Execute failed:", error);
        return {
          success: false,
          decision: "ERROR" as const,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
