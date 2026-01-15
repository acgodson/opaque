import { type Delegation } from "@metamask/delegation-toolkit";
import { type Address, type Hex } from "viem";
interface CreateDelegationParams {
    delegator: Address;
    delegate: Address;
    token: Address;
    amount: bigint;
    period: number;
}
interface DelegationResult {
    delegation: Delegation;
    delegationHash: Hex;
}
declare class DelegationService {
    private environment;
    createTokenDelegation(params: CreateDelegationParams): Promise<DelegationResult>;
    getDelegationManager(): Address;
    getEnvironment(): import("@metamask/delegation-toolkit").DeleGatorEnvironment;
}
export declare const delegationService: DelegationService;
export {};
