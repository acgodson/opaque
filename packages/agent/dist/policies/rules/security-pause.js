export const securityPauseRule = {
    type: "security-pause",
    name: "Security Pause",
    description: "Pause execution when redemption spikes are detected",
    defaultConfig: {
        pauseOnGlobalSpike: true,
        pauseOnUserSpike: true,
        thresholdMultiplier: 2,
        globalThreshold: 10,
        userThreshold: 5,
        timeWindowMinutes: 60,
    },
    async evaluate(context, config) {
        const { pauseOnGlobalSpike = true, pauseOnUserSpike = true, thresholdMultiplier = 2, globalThreshold, userThreshold = 5, timeWindowMinutes = 60, } = config;
        const envioSignal = context.signals.envio;
        if (!envioSignal) {
            return {
                policyType: "security-pause",
                policyName: "Security Pause",
                allowed: true,
                reason: "Security monitoring unavailable",
            };
        }
        // Check global spike
        if (pauseOnGlobalSpike && envioSignal.globalSpike?.spikeDetected) {
            const spike = envioSignal.globalSpike;
            return {
                policyType: "security-pause",
                policyName: "Security Pause",
                allowed: false,
                reason: `Global redemption spike detected: ${spike.currentCount} redemptions in last ${spike.timeWindowMinutes} minutes (threshold: ${spike.threshold})`,
                metadata: {
                    spikeType: "global",
                    currentCount: spike.currentCount,
                    previousCount: spike.previousCount,
                    threshold: spike.threshold,
                },
            };
        }
        // Check user-specific spike if user address is available
        if (pauseOnUserSpike && context.userAddress) {
            // Note: User-specific spike detection would need to be implemented
            // by querying Envio API with userAddress filter
            // For now, we check if user has excessive redemptions in recent time
            const userRedemptions = envioSignal.recentRedemptions?.filter((r) => r.rootDelegator?.toLowerCase() === context.userAddress.toLowerCase()) || [];
            if (userRedemptions.length >= userThreshold) {
                return {
                    policyType: "security-pause",
                    policyName: "Security Pause",
                    allowed: false,
                    reason: `User redemption threshold exceeded: ${userRedemptions.length} redemptions in recent period (threshold: ${userThreshold})`,
                    metadata: {
                        spikeType: "user",
                        redemptionCount: userRedemptions.length,
                        threshold: userThreshold,
                    },
                };
            }
        }
        return {
            policyType: "security-pause",
            policyName: "Security Pause",
            allowed: true,
            reason: "No redemption spikes detected",
        };
    },
};
