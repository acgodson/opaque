export interface TokenInfo {
    symbol: string;
    name: string;
    address: `0x${string}`;
    decimals: number;
}
export declare const SUPPORTED_TOKENS: Record<string, TokenInfo>;
export declare function getTokenInfo(symbol: string): TokenInfo | undefined;
export declare function getTokenAddress(symbol: string): `0x${string}`;
export declare function getTokenDecimals(symbol: string): number;
export declare function isSupportedToken(symbol: string): boolean;
export declare function getSupportedTokens(): string[];
export declare function getAllTokens(): TokenInfo[];
