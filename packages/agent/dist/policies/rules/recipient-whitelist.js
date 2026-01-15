/**
 * Recipient Whitelist Rule
 *
 * Enforces that transactions only go to approved addresses.
 * Prepares configuration for the enclave's Merkle tree verification.
 */
export const recipientWhitelistRule = {
    type: "recipient-whitelist",
    name: "Recipient Whitelist",
    description: "Only allow transfers to whitelisted addresses",
    defaultConfig: { allowed: [] },
    async prepareConfig(context, config) {
        const { allowed = [] } = config;
        return {
            whitelist: {
                enabled: allowed.length > 0,
                root: config.merkleRoot || "0x0000000000000000000000000000000000000000000000000000000000000000",
                path: config.merklePath || ["0x0", "0x0"],
                index: config.merkleIndex || 0,
            },
        };
    },
};
