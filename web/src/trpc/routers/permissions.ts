import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { permissions } from "../../db";
import { eq, and } from "drizzle-orm";
import { delegationService } from "@0xvisor/agent";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

export const permissionsRouter = createTRPCRouter({
  // Create a new permission
  create: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        type: z.string(),
        tokenAddress: ethereumAddress,
        sessionAddress: ethereumAddress,
        amount: z.string(),
        period: z.number(),
        delegation: z.any().optional(), // ERC-7715 delegation from frontend
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("Permission request:", input);

        let delegation;
        let delegationHash: string;

        // If frontend sent a signed delegation, use it; otherwise create one server-side
        if (input.delegation) {
          console.log("Using delegation from frontend (signed by MetaMask)");
          delegation = input.delegation;

          // Calculate hash from the ERC-7715 permission object
          const { keccak256, encodePacked } = await import("viem");

          // Extract addresses from ERC-7715 permission structure
          const delegator = delegation.address as `0x${string}`; // User's address
          const delegate = delegation.signer.data.address as `0x${string}`; // Session account address

          delegationHash = keccak256(
            encodePacked(["address", "address"], [delegator, delegate])
          );
        } else {
          const isNative = input.tokenAddress === "0x0000000000000000000000000000000000000000";
          const tokenAddress = isNative ? "0x0000000000000000000000000000000000000000" : input.tokenAddress;
          
          const result = await delegationService.createTokenDelegation({
            delegator: input.userAddress as `0x${string}`,
            delegate: input.sessionAddress as `0x${string}`,
            token: tokenAddress as `0x${string}`,
            amount: BigInt(input.amount),
            period: input.period,
          });
          delegation = result.delegation;
          delegationHash = result.delegationHash;
        }

        console.log("Delegation hash:", delegationHash);
        console.log("Inserting into database...");

        const [inserted] = await ctx.db
          .insert(permissions)
          .values({
            userAddress: input.userAddress.toLowerCase(),
            permissionType: input.type,
            tokenAddress: input.tokenAddress.toLowerCase(),
            delegationHash,
            delegationData: delegation,
            isActive: true,
          })
          .returning();

        console.log("Permission inserted successfully:", inserted.id);

        return {
          permission: {
            id: inserted.id,
            permissionType: inserted.permissionType,
            tokenAddress: inserted.tokenAddress,
            delegationHash: inserted.delegationHash,
            grantedAt: inserted.grantedAt.toISOString(),
            isActive: inserted.isActive,
          },
        };
      } catch (error) {
        console.error("[ERROR] Permission creation failed:", error);
        throw error;
      }
    }),

  // List permissions for user
  list: baseProcedure
    .input(z.object({ userAddress: ethereumAddress }))
    .query(async ({ input, ctx }) => {
      const normalizedAddress = input.userAddress.toLowerCase();

      const userPermissions = await ctx.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.userAddress, normalizedAddress),
            eq(permissions.isActive, true)
          )
        );

      return {
        permissions: userPermissions.map((p) => ({
          id: p.id,
          permissionType: p.permissionType,
          tokenAddress: p.tokenAddress,
          delegationHash: p.delegationHash,
          grantedAt: p.grantedAt.toISOString(),
          isActive: p.isActive,
        })),
      };
    }),
});
