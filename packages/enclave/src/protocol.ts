export interface ProvisionKeyRequest {
  type: "PROVISION_KEY";
  sessionAccountId: string;
  privateKey: `0x${string}`;
  userAddress: `0x${string}`;
  adapterId: string;
  deployParams: any;
}

export interface SignTransactionRequest {
  type: "SIGN_TRANSACTION";
  sessionAccountId: string;
  proposedTx: any;
  policyRules: any[];
  signals: any;
  preparedUserOperation: {
    sender: `0x${string}`;
    nonce: bigint;
    callData: `0x${string}`;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    signature: `0x${string}`;
    paymaster?: `0x${string}`;
    paymasterVerificationGasLimit?: bigint;
    paymasterPostOpGasLimit?: bigint;
    paymasterData?: `0x${string}`;
  };
  context: {
    userAddress: `0x${string}`;
    adapterId: string;
    lastExecutionTime?: string;
  };
}

export interface HealthCheckRequest {
  type: "HEALTH_CHECK";
}

export type EnclaveRequest =
  | ProvisionKeyRequest
  | SignTransactionRequest
  | HealthCheckRequest;

export interface ProvisionKeyResponse {
  success: true;
  sessionAccountAddress: `0x${string}`;
}

export interface SignTransactionAllowResponse {
  allowed: true;
  decision: "ALLOW";
  signature: `0x${string}`;
  userOpHash: `0x${string}`;
  policyDecisions: any[];
}

export interface SignTransactionBlockResponse {
  allowed: false;
  decision: "BLOCK";
  reason: string;
  blockingPolicy: string;
  policyDecisions: any[];
}

export interface SignTransactionErrorResponse {
  allowed: false;
  decision: "ERROR";
  reason: string;
}

export type SignTransactionResponse =
  | SignTransactionAllowResponse
  | SignTransactionBlockResponse
  | SignTransactionErrorResponse;

export interface HealthCheckResponse {
  status: "healthy";
  timestamp: string;
  keyCount: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type EnclaveResponse =
  | ProvisionKeyResponse
  | SignTransactionResponse
  | HealthCheckResponse
  | ErrorResponse;
