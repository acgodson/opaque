import type { EnclaveRequest, EnclaveResponse } from "./protocol.js";
import { keyStore } from "./key-store.js";
import { evaluatePolicies } from "./policy-evaluator.js";
import { signTransaction } from "./signer.js";

export async function handleRequest(request: EnclaveRequest): Promise<EnclaveResponse> {
  if (request.type === "HEALTH_CHECK") {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      keyCount: keyStore.getKeyCount(),
    };
  }

  if (request.type === "PROVISION_KEY") {
    const { sessionAccountId, privateKey, userAddress, adapterId, deployParams } = request;
    const result = await keyStore.provision(sessionAccountId, privateKey, userAddress, adapterId, deployParams);
    return {
      success: true,
      sessionAccountAddress: result.address,
    };
  }

  if (request.type === "SIGN_TRANSACTION") {
    const key = keyStore.getKey(request.sessionAccountId);
    if (!key) {
      return {
        allowed: false,
        decision: "ERROR",
        reason: "Session account not found in enclave",
      };
    }

    const evaluation = await evaluatePolicies(
      request.context.userAddress,
      request.context.adapterId,
      request.proposedTx,
      {
        policyRules: request.policyRules,
        signals: request.signals,
        lastExecutionTime: request.context.lastExecutionTime
          ? new Date(request.context.lastExecutionTime)
          : undefined,
      }
    );

    if (!evaluation.allowed) {
      return {
        allowed: false,
        decision: "BLOCK",
        reason: evaluation.blockingReason || "Policy blocked",
        blockingPolicy: evaluation.blockingPolicy || "unknown",
        policyDecisions: evaluation.decisions,
      };
    }

    try {
      const { signature } = await signTransaction({
        privateKey: key.privateKey,
        smartAccountAddress: key.smartAccountAddress,
        deployParams: key.deployParams,
        preparedUserOperation: request.preparedUserOperation,
      });

      return {
        allowed: true,
        decision: "ALLOW",
        signature,
        userOpHash: "0x",
        policyDecisions: evaluation.decisions,
      };
    } catch (error) {
      return {
        allowed: false,
        decision: "ERROR",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { success: false, error: "Unknown request type" };
}
