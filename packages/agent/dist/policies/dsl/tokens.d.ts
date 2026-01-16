export interface TokenInfo {
    symbol: string;
    name: string;
    address: `0x${string}`;
    decimals: number;
    icon?: string;
}
export declare const SUPPORTED_TOKENS: Record<string, TokenInfo>;
export declare function getTokenInfo(symbol: string): TokenInfo | undefined;
export declare function getTokenAddress(symbol: string): `0x${string}`;
/**
 * Get token decimals by symbol
 *
 * @param symbol Token symbol (case-insensitive)
 * @returns Token decimals or throws error if not found
 * @throws Error if token is not supported
 */
export declare function getTokenDecimals(symbol: string): number;
/**
 * Check if a token is supported
 *
 * @param symbol Token symbol (case-insensitive)
 * @returns True if token is supported
 */
export declare function isSupportedToken(symbol: string): boolean;
/**
 * Get all supported token symbols
 *
 * @returns Array of token symbols
 */
export declare function getSupportedTokens(): string[];
/**
 * Get all token information as array
 *
 * @returns Array of TokenInfo
 */
export declare function getAllTokens(): TokenInfo[];
