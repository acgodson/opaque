export const SUPPORTED_TOKENS = {
    USDC: {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        decimals: 6,
    },
    MNT: {
        symbol: "MNT",
        name: "Mantle Token",
        address: "0xb7dB7655F37a5009fE0eE026ed95796E26388481",
        decimals: 18,
    },
};
export function getTokenInfo(symbol) {
    return SUPPORTED_TOKENS[symbol.toUpperCase()];
}
export function getTokenAddress(symbol) {
    const token = getTokenInfo(symbol);
    if (!token)
        throw new Error(`Unsupported token: ${symbol}`);
    return token.address;
}
export function getTokenDecimals(symbol) {
    const token = getTokenInfo(symbol);
    if (!token)
        throw new Error(`Unsupported token: ${symbol}`);
    return token.decimals;
}
export function isSupportedToken(symbol) {
    return symbol.toUpperCase() in SUPPORTED_TOKENS;
}
export function getSupportedTokens() {
    return Object.keys(SUPPORTED_TOKENS);
}
export function getAllTokens() {
    return Object.values(SUPPORTED_TOKENS);
}
