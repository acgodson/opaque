const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL;
export const envioSignal = {
    name: "envio",
    description: "On-chain events and redemption spike detection from Envio",
    async fetch() {
        let recentRedemptions = [];
        let globalSpike = null;
        let envioConnected = false;
        if (ENVIO_GRAPHQL_URL) {
            try {
                const now = Math.floor(Date.now() / 1000);
                const oneHourAgo = now - 3600;
                const twoHoursAgo = now - 7200;
                // Fetch recent redemptions
                const recentResponse = await fetch(ENVIO_GRAPHQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: `
              query EnvioSignalData {
                Redemption(limit: 50, order_by: {blockTimestamp: desc}) {
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
                    }),
                });
                // Fetch current and previous window for spike detection
                const [currentResponse, previousResponse] = await Promise.all([
                    fetch(ENVIO_GRAPHQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            query: `
                query GetCurrentRedemptions($since: BigInt!) {
                  Redemption(
                    where: {blockTimestamp: {_gte: $since}}
                  ) {
                    id
                    blockTimestamp
                  }
                }
              `,
                            variables: { since: oneHourAgo.toString() },
                        }),
                    }),
                    fetch(ENVIO_GRAPHQL_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            query: `
                query GetPreviousRedemptions($previousSince: BigInt!, $since: BigInt!) {
                  Redemption(
                    where: {blockTimestamp: {_gte: $previousSince, _lt: $since}}
                  ) {
                    id
                    blockTimestamp
                  }
                }
              `,
                            variables: {
                                previousSince: twoHoursAgo.toString(),
                                since: oneHourAgo.toString(),
                            },
                        }),
                    }),
                ]);
                const recentData = await recentResponse.json();
                const currentData = await currentResponse.json();
                const previousData = await previousResponse.json();
                recentRedemptions = recentData.data?.Redemption || [];
                const currentCount = currentData.data?.Redemption?.length || 0;
                const previousCount = previousData.data?.Redemption?.length || 0;
                const average = previousCount > 0 ? previousCount : 1;
                const thresholdMultiplier = 2; // 2x spike threshold
                const spikeDetected = currentCount >= average * thresholdMultiplier;
                globalSpike = {
                    currentCount,
                    previousCount,
                    spikeDetected,
                    threshold: Math.ceil(average * thresholdMultiplier),
                    timeWindowMinutes: 60,
                    isGlobal: true,
                };
                envioConnected = true;
            }
            catch (error) {
                console.error("Failed to fetch from Envio:", error);
            }
        }
        return {
            timestamp: new Date(),
            recentRedemptions,
            globalSpike,
            envioConnected,
            spikeDetected: globalSpike?.spikeDetected || false,
        };
    },
};
