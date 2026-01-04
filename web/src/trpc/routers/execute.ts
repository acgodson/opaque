import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { installedAdapters, permissions, sessionAccounts, executionLogs, userPolicies } from "../../db";
import { eq, and } from "drizzle-orm";
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

        // 1. Fetch installed adapter from DB
        const installed = await ctx.db.query.installedAdapters.findFirst({
          where: and(
            eq(installedAdapters.userAddress, normalizedAddress),
            eq(installedAdapters.adapterId, input.adapterId),
            eq(installedAdapters.isActive, true)
          ),
        });

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

        // 3. Fetch permission from DB if exists
        const permission = installed.permissionId
          ? await ctx.db.query.permissions.findFirst({
              where: eq(permissions.id, installed.permissionId),
            })
          : null;

        if (!permission) {
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "No permission found for this adapter",
          };
        }

        // 4. Fetch session from DB
        const session = await ctx.db.query.sessionAccounts.findFirst({
          where: and(
            eq(sessionAccounts.userAddress, normalizedAddress),
            eq(sessionAccounts.adapterId, input.adapterId)
          ),
        });

        if (!session) {
          return {
            success: false,
            decision: "ERROR" as const,
            reason: "Session not found",
          };
        }

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

        const lastExecution = await ctx.db.query.executionLogs.findFirst({
          where: (logs: any, { eq, and }: any) =>
            and(
              eq(logs.userAddress, normalizedAddress),
              eq(logs.adapterId, input.adapterId)
            ),
          orderBy: (logs: any, { desc }: any) => [desc(logs.executedAt)],
        });

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

        // 9. Fetch policy rules and signals for enclave
        const userPolicies = await ctx.db.query.userPolicies.findMany({
          where: (policies: any, { eq, and }: any) =>
            and(
              eq(policies.userAddress, normalizedAddress),
              eq(policies.isEnabled, true)
            ),
        });

        // 10. Execute transaction with ERC-7710 delegation
        const result = await executor.executeAdapter({
          userAddress: normalizedAddress as `0x${string}`,
          adapter,
          session: {
            sessionAccountId: session.sessionAccountId,
            smartAccountAddress: session.address as `0x${string}`,
            deployParams: session.deployParams as any,
          },
          installedAdapterData: {
            config,
            permissionId: installed.permissionId || undefined,
          },
          runtimeParams: input.runtimeParams,
          permissionDelegationData: permissionData,
          enclaveClient: ctx.enclaveClient,
          policyRules: userPolicies.map((p) => ({
            type: p.policyType,
            config: p.config,
          })),
          signals: {},
          lastExecutionTime: lastExecution?.executedAt,
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
