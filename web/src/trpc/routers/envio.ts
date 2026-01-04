import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";

const ethereumAddress = z
  .string()
  .transform((val) => val.toLowerCase())
  .refine((val) => /^0x[a-f0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address",
  });

const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL;

async function queryEnvio(query: string, variables?: Record<string, any>) {
  if (!ENVIO_GRAPHQL_URL) {
    throw new Error("ENVIO_GRAPHQL_URL not configured");
  }

  const response = await fetch(ENVIO_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Envio query failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Envio query error: ${data.errors[0].message}`);
  }

  return data.data;
}

export const envioRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    const data = await queryEnvio(`
      query GetStats {
        Stats(where: {id: {_eq: "global"}}) {
          id
          totalRedemptions
          totalEnabled
          totalDisabled
          lastUpdated
        }
      }
    `);

    return {
      stats: data.Stats?.[0] || null,
    };
  }),

  getRecentRedemptions: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const data = await queryEnvio(
        `
        query GetRecentRedemptions($limit: Int!) {
          Redemption(
            limit: $limit
            order_by: {timestamp: desc}
          ) {
            id
            rootDelegator
            redeemer
            delegationHash
            blockNumber
            timestamp
            transactionHash
          }
        }
      `,
        { limit: input.limit }
      );

      return {
        redemptions: data.Redemption || [],
      };
    }),

  getUserRedemptions: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const data = await queryEnvio(
        `
        query GetUserRedemptions($address: String!, $limit: Int!) {
          Redemption(
            where: {rootDelegator: {_eq: $address}}
            limit: $limit
            order_by: {timestamp: desc}
          ) {
            id
            rootDelegator
            redeemer
            delegationHash
            blockNumber
            timestamp
            transactionHash
          }
        }
      `,
        { address: input.userAddress.toLowerCase(), limit: input.limit }
      );

      return {
        redemptions: data.Redemption || [],
        count: data.Redemption?.length || 0,
      };
    }),

  getUserRedemptionCount: baseProcedure
    .input(
      z.object({
        userAddress: ethereumAddress,
      })
    )
    .query(async ({ input }) => {
      const data = await queryEnvio(
        `
        query GetUserRedemptionCount($address: String!) {
          Redemption(
            where: {rootDelegator: {_eq: $address}}
          ) {
            id
          }
        }
      `,
        { address: input.userAddress.toLowerCase() }
      );

      return {
        count: data.Redemption?.length || 0,
      };
    }),

  getSecurityAlerts: baseProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const where = input.isActive !== undefined
        ? `where: {isActive: {_eq: ${input.isActive}}}`
        : "";

      const data = await queryEnvio(`
        query GetSecurityAlerts {
          SecurityAlert(
            ${where}
            limit: ${input.limit}
            order_by: {createdAt: desc}
          ) {
            id
            alertType
            severity
            message
            userAddress
            triggerCount
            isActive
            createdAt
            resolvedAt
            metadata
          }
        }
      `);

      return {
        alerts: data.SecurityAlert || [],
      };
    }),

  getDelegationHistory: baseProcedure
    .input(
      z.object({
        delegationHash: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [enabled, disabled, redemptions] = await Promise.all([
        queryEnvio(
          `
          query GetEnabledDelegation($hash: String!) {
            EnabledDelegation(
              where: {delegationHash: {_eq: $hash}}
            ) {
              id
              delegationHash
              blockNumber
              timestamp
              transactionHash
            }
          }
        `,
          { hash: input.delegationHash }
        ),
        queryEnvio(
          `
          query GetDisabledDelegation($hash: String!) {
            DisabledDelegation(
              where: {delegationHash: {_eq: $hash}}
            ) {
              id
              delegationHash
              blockNumber
              timestamp
              transactionHash
            }
          }
        `,
          { hash: input.delegationHash }
        ),
        queryEnvio(
          `
          query GetRedemptionsByHash($hash: String!) {
            Redemption(
              where: {delegationHash: {_eq: $hash}}
              order_by: {timestamp: desc}
            ) {
              id
              rootDelegator
              redeemer
              blockNumber
              timestamp
              transactionHash
            }
          }
        `,
          { hash: input.delegationHash }
        ),
      ]);

      return {
        enabled: enabled.EnabledDelegation?.[0] || null,
        disabled: disabled.DisabledDelegation?.[0] || null,
        redemptions: redemptions.Redemption || [],
        redemptionCount: redemptions.Redemption?.length || 0,
      };
    }),
});

