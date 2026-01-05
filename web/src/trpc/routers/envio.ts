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
  getRootDelegatorCount: baseProcedure.query(async () => {
    // Count unique rootDelegators for monitoring dashboard
    const data = await queryEnvio(`
      query GetRootDelegatorCount {
        Redemption {
          rootDelegator
        }
      }
    `);

    const uniqueDelegators = new Set(
      (data.Redemption || []).map((r: any) => r.rootDelegator.toLowerCase())
    );

    return {
      count: uniqueDelegators.size,
    };
  }),

  getSessionAccountRedemptions: baseProcedure
    .input(
      z.object({
        sessionAccountAddress: ethereumAddress,
        timeWindowHours: z.number().optional().default(24),
      })
    )
    .query(async ({ input }) => {
      // Count redemptions by redeemer (session account) within time window
      const timeWindowSeconds = input.timeWindowHours * 3600;
      const now = Math.floor(Date.now() / 1000);
      const since = now - timeWindowSeconds;

      const data = await queryEnvio(
        `
        query GetSessionAccountRedemptions($redeemer: String!, $since: numeric!) {
          Redemption(
            where: {redeemer: {_eq: $redeemer}, blockTimestamp: {_gte: $since}}
            order_by: {blockNumber: desc}
          ) {
            id
            rootDelegator
            redeemer
            blockNumber
            blockTimestamp
            transactionHash
          }
        }
      `,
        {
          redeemer: input.sessionAccountAddress.toLowerCase(),
          since: since.toString(),
        }
      );

      return {
        redemptions: data.Redemption || [],
        count: data.Redemption?.length || 0,
        timeWindowHours: input.timeWindowHours,
      };
    }),

  getRedemptionSpike: baseProcedure
    .input(
      z.object({
        timeWindowMinutes: z.number().min(1).max(1440).default(60),
        thresholdMultiplier: z.number().min(1).default(2),
        globalThreshold: z.number().optional(),
        userAddress: ethereumAddress.optional(),
      })
    )
    .query(async ({ input }) => {
      // Detect redemption spikes over time period
      const timeWindowSeconds = input.timeWindowMinutes * 60;
      const now = Math.floor(Date.now() / 1000);
      const since = now - timeWindowSeconds;
      const previousWindowSince = now - (timeWindowSeconds * 2);

      const variables: any = {
        since: since.toString(),
        previousSince: previousWindowSince.toString(),
      };

      if (input.userAddress) {
        variables.userAddress = input.userAddress.toLowerCase();
      }

      const currentVariables = input.userAddress
        ? { userAddress: variables.userAddress, since: variables.since }
        : { since: variables.since };

      const previousVariables = input.userAddress
        ? { userAddress: variables.userAddress, previousSince: variables.previousSince, since: variables.since }
        : { previousSince: variables.previousSince, since: variables.since };

      const [currentData, previousData] = await Promise.all([
        queryEnvio(
          input.userAddress
            ? `
            query GetCurrentRedemptions($userAddress: String!, $since: numeric!) {
              Redemption(
                where: {rootDelegator: {_eq: $userAddress}, blockTimestamp: {_gte: $since}}
              ) {
                id
                blockTimestamp
              }
            }
          `
            : `
            query GetCurrentRedemptions($since: numeric!) {
              Redemption(
                where: {blockTimestamp: {_gte: $since}}
              ) {
                id
                blockTimestamp
              }
            }
          `,
          currentVariables
        ),
        queryEnvio(
          input.userAddress
            ? `
            query GetPreviousRedemptions($userAddress: String!, $previousSince: numeric!, $since: numeric!) {
              Redemption(
                where: {rootDelegator: {_eq: $userAddress}, blockTimestamp: {_gte: $previousSince, _lt: $since}}
              ) {
                id
                blockTimestamp
              }
            }
          `
            : `
            query GetPreviousRedemptions($previousSince: numeric!, $since: numeric!) {
              Redemption(
                where: {blockTimestamp: {_gte: $previousSince, _lt: $since}}
              ) {
                id
                blockTimestamp
              }
            }
          `,
          previousVariables
        ),
      ]);

      const currentCount = currentData.Redemption?.length || 0;
      const previousCount = previousData.Redemption?.length || 0;
      const average = previousCount > 0 ? previousCount : 1;
      const spikeDetected = currentCount >= average * input.thresholdMultiplier;
      const spikeDetectedByThreshold =
        input.globalThreshold !== undefined &&
        currentCount >= input.globalThreshold;

      return {
        currentCount,
        previousCount,
        spikeDetected: spikeDetected || spikeDetectedByThreshold,
        threshold: Math.ceil(average * input.thresholdMultiplier),
        timeWindowMinutes: input.timeWindowMinutes,
        isGlobal: !input.userAddress,
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
            order_by: {blockNumber: desc}
          ) {
            id
            rootDelegator
            redeemer
            delegationHash
            blockNumber
            blockTimestamp
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
            order_by: {blockNumber: desc}
          ) {
            id
            rootDelegator
            redeemer
            delegationHash
            blockNumber
            blockTimestamp
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
      const address = input.userAddress.toLowerCase();
      
      const data = await queryEnvio(
        `
        query GetUserRedemptions($address: String!) {
          Redemption(
            where: {rootDelegator: {_eq: $address}}
          ) {
            id
          }
        }
      `,
        { address }
      );

      return {
        count: data.Redemption?.length || 0,
      };
    }),

});

