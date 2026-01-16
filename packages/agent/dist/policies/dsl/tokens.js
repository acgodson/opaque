export const SUPPORTED_TOKENS = {
    USDC: {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        decimals: 6,
        icon: "💵",
    },
    USDT: {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
        decimals: 6,
        icon: "💵",
    },
    DAI: {
        symbol: "DAI",
        name: "Dai Stablecoin",
        address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
        decimals: 18,
        icon: "💰",
    },
    WETH: {
        symbol: "WETH",
        name: "Wrapped Ether",
        address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        decimals: 18,
        icon: "⟠",
    },
};
export function getTokenInfo(symbol) {
    return SUPPORTED_TOKENS[symbol.toUpperCase()];
}
export function getTokenAddress(symbol) {
    const token = getTokenInfo(symbol);
    if (!token) {
        throw new Error(`Unsupported token: ${symbol}. Supported tokens: ${Object.keys(SUPPORTED_TOKENS).join(", ")}`);
    }
    return token.address;
}
/**
 * Get token decimals by symbol
 *
 * @param symbol Token symbol (case-insensitive)
 * @returns Token decimals or throws error if not found
 * @throws Error if token is not supported
 */
export function getTokenDecimals(symbol) {
    const token = getTokenInfo(symbol);
    if (!token) {
        throw new Error(`Unsupported token: ${symbol}. Supported tokens: ${Object.keys(SUPPORTED_TOKENS).join(", ")}`);
    }
    return token.decimals;
}
/**
 * Check if a token is supported
 *
 * @param symbol Token symbol (case-insensitive)
 * @returns True if token is supported
 */
export function isSupportedToken(symbol) {
    return symbol.toUpperCase() in SUPPORTED_TOKENS;
}
/**
 * Get all supported token symbols
 *
 * @returns Array of token symbols
 */
export function getSupportedTokens() {
    return Object.keys(SUPPORTED_TOKENS);
}
/**
 * Get all token information as array
 *
 * @returns Array of TokenInfo
 */
export function getAllTokens() {
    return Object.values(SUPPORTED_TOKENS);
}
