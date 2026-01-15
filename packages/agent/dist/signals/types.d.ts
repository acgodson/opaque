export interface SignalData {
    timestamp: Date;
    [key: string]: any;
}
export interface Signal {
    name: string;
    description: string;
    fetch: () => Promise<SignalData>;
}
