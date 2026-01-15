import type { Adapter, AdapterMetadata } from "./types.js";
export declare function getAdapter(id: string): Adapter | undefined;
export declare function getAllAdapters(): Adapter[];
export declare function getAdapterMetadata(): AdapterMetadata[];
export * from "./types.js";
export { mantleTransferAdapter } from "./mantle-transfer.js";
