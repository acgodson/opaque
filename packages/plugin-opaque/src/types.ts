export interface StorePolicyConfigRequest {
    type: "STORE_POLICY_CONFIG";
    userAddress: string;
    installationId: number;
    policyConfig: any;
}

export interface GenerateProofRequest {
    type: "GENERATE_PROOF";
    userAddress: string;
    installationId: number;
    txData: {
        amount: string;
        recipient: string;
        timestamp: number;
        userAddress: string;
    };
}

export interface HealthCheckRequest {
    type: "HEALTH_CHECK";
}

export type EnclaveRequest =
    | StorePolicyConfigRequest
    | GenerateProofRequest
    | HealthCheckRequest;

export interface StorePolicyConfigResponse {
    success: true;
    message: string;
}

export interface GenerateProofResponse {
    success: true;
    proof: string;
    publicInputs: {
        policySatisfied: string;
        nullifier: string;
        userAddressHash: string;
    };
}

export interface HealthCheckResponse {
    status: "healthy";
    timestamp: string;
    policyCount: number;
}

export interface ErrorResponse {
    success: false;
    error: string;
}

export type EnclaveResponse =
    | StorePolicyConfigResponse
    | GenerateProofResponse
    | HealthCheckResponse
    | ErrorResponse;
