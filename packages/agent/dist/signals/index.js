import { gasSignal } from "./gas-signal.js";
import { timeSignal } from "./time-signal.js";
import { envioSignal } from "./envio-signal.js";
export const signalRegistry = new Map([
    [gasSignal.name, gasSignal],
    [timeSignal.name, timeSignal],
    [envioSignal.name, envioSignal],
]);
export function getSignal(name) {
    return signalRegistry.get(name);
}
export function getAllSignals() {
    return Array.from(signalRegistry.values());
}
export async function fetchAllSignals() {
    const signals = {};
    for (const [name, signal] of signalRegistry) {
        try {
            signals[name] = await signal.fetch();
        }
        catch (error) {
            console.error(`Failed to fetch signal ${name}:`, error);
            signals[name] = { timestamp: new Date(), error: String(error) };
        }
    }
    return signals;
}
export * from "./types.js";
