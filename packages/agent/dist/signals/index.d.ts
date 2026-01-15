import type { Signal, SignalData } from "./types.js";
export declare const signalRegistry: Map<string, Signal>;
export declare function getSignal(name: string): Signal | undefined;
export declare function getAllSignals(): Signal[];
export declare function fetchAllSignals(): Promise<Record<string, SignalData>>;
export * from "./types.js";
