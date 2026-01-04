import type { ProposedTransaction } from "@0xvisor/agent";
import axios from "axios";

interface SessionEnclaveClient {
  provisionKey(request: {
    sessionAccountId: string;
    privateKey: `0x${string}`;
    userAddress: `0x${string}`;
    adapterId: string;
    deployParams: [
      owner: `0x${string}`,
      keyIds: string[],
      xValues: bigint[],
      yValues: bigint[]
    ];
  }): Promise<{
    success: boolean;
    sessionAccountAddress: `0x${string}`;
  }>;
}

export interface ExecutorEnclaveClient {
  signUserOperation(request: {
    sessionAccountId: string;
    preparedUserOperation: any;
    proposedTx: ProposedTransaction;
    policyRules: any[];
    signals: any;
    context: {
      userAddress: `0x${string}`;
      adapterId: string;
      lastExecutionTime?: string;
    };
  }): Promise<{
    allowed: boolean;
    decision: string;
    signature?: `0x${string}`;
    userOpHash?: `0x${string}`;
    reason?: string;
    policyDecisions?: any[];
  }>;
}

class EnclaveClientImpl implements SessionEnclaveClient, ExecutorEnclaveClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.ENCLAVE_URL || "http://localhost:8000";
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === "bigint") {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeBigInt(item));
    }
    if (typeof obj === "object") {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serializeBigInt(value);
      }
      return result;
    }
    return obj;
  }

  private async sendRequest(request: any): Promise<any> {
    const serializedRequest = this.serializeBigInt(request);
    const jsonStr = JSON.stringify(serializedRequest);

    console.log("[ENCLAVE CLIENT] Total length:", jsonStr.length);
    console.log("[ENCLAVE CLIENT] Target URL:", this.baseUrl);
    console.log(
      "[ENCLAVE CLIENT] Request size:",
      jsonStr.length,
      "bytes"
    );
    console.log(
      "[ENCLAVE CLIENT] Starting request at:",
      new Date().toISOString()
    );

    try {
      console.log("[ENCLAVE CLIENT] 🚀 Calling axios...");

      const buffer = Buffer.from(jsonStr, "utf8");
      const contentLength = buffer.length;

      const response = await axios.post(
        this.baseUrl,
        buffer,
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Length": contentLength.toString(),
          },
          timeout: 60000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          transformRequest: [],
        }
      );

      console.log("[ENCLAVE CLIENT] ✅ Response received:", response.status);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("[ENCLAVE CLIENT] ❌ Axios error:", {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          responseData: error.response?.data,
        });

        if (error.code === "ECONNABORTED") {
          throw new Error("Request timeout after 60 seconds");
        }

        if (error.response) {
          throw new Error(
            `Enclave request failed: ${error.response.status} ${JSON.stringify(
              error.response.data
            )}`
          );
        }
      }

      console.error("[ENCLAVE CLIENT] ❌ Full error:", error);
      throw error;
    }
  }

  async provisionKey(request: {
    sessionAccountId: string;
    privateKey: `0x${string}`;
    userAddress: `0x${string}`;
    adapterId: string;
    deployParams: [
      owner: `0x${string}`,
      keyIds: string[],
      xValues: bigint[],
      yValues: bigint[]
    ];
  }): Promise<{
    success: boolean;
    sessionAccountAddress: `0x${string}`;
  }> {
    const enclaveRequest = {
      type: "PROVISION_KEY",
      sessionAccountId: request.sessionAccountId,
      privateKey: request.privateKey,
      userAddress: request.userAddress,
      adapterId: request.adapterId,
      deployParams: request.deployParams,
    };

    console.log(
      `[ENCLAVE] Provisioning key for session: ${request.sessionAccountId}`
    );
    console.log(
      `[ENCLAVE] User: ${request.userAddress}, Adapter: ${request.adapterId}`
    );

    const response = await this.sendRequest(enclaveRequest);

    console.log(`[ENCLAVE] Response:`, {
      success: response.success,
      sessionAccountAddress: response.sessionAccountAddress,
    });

    return {
      success: response.success ?? true,
      sessionAccountAddress: response.sessionAccountAddress,
    };
  }

  async signUserOperation(request: {
    sessionAccountId: string;
    preparedUserOperation: any;
    proposedTx: ProposedTransaction;
    policyRules: any[];
    signals: any;
    context: {
      userAddress: `0x${string}`;
      adapterId: string;
      lastExecutionTime?: string;
    };
  }): Promise<{
    allowed: boolean;
    decision: string;
    signature?: `0x${string}`;
    userOpHash?: `0x${string}`;
    reason?: string;
    policyDecisions?: any[];
  }> {
    console.log("[ENCLAVE CLIENT] 🔧 Building UserOp...");

    // Build the prepared UserOp with ALL fields
    const preparedUserOperation: any = {
      sender: request.preparedUserOperation.sender,
      nonce: request.preparedUserOperation.nonce,
      callData: request.preparedUserOperation.callData,
      callGasLimit: request.preparedUserOperation.callGasLimit,
      verificationGasLimit: request.preparedUserOperation.verificationGasLimit,
      preVerificationGas: request.preparedUserOperation.preVerificationGas,
      maxFeePerGas: request.preparedUserOperation.maxFeePerGas,
      maxPriorityFeePerGas: request.preparedUserOperation.maxPriorityFeePerGas,
      signature: request.preparedUserOperation.signature || "0x",
      paymaster: request.preparedUserOperation.paymaster,
      paymasterVerificationGasLimit:
        request.preparedUserOperation.paymasterVerificationGasLimit,
      paymasterPostOpGasLimit: request.preparedUserOperation.paymasterPostOpGasLimit,
      paymasterData: request.preparedUserOperation.paymasterData,
    };

    // Add factory fields if present (for account deployment)
    if (request.preparedUserOperation.factory) {
      preparedUserOperation.factory = request.preparedUserOperation.factory;
      preparedUserOperation.factoryData = request.preparedUserOperation.factoryData;
    }

    console.log("[ENCLAVE CLIENT] Prepared UserOp:", {
      sender: preparedUserOperation.sender,
      hasFactory: !!preparedUserOperation.factory,
      hasPaymaster: !!preparedUserOperation.paymaster,
    });

    const enclaveRequest = {
      type: "SIGN_TRANSACTION",
      sessionAccountId: request.sessionAccountId,
      proposedTx: request.proposedTx,
      policyRules: request.policyRules,
      signals: request.signals,
      preparedUserOperation,
      context: request.context,
    };

    console.log("[ENCLAVE CLIENT] 📤 Sending request to enclave...");
    const response = await this.sendRequest(enclaveRequest);
    console.log("[ENCLAVE CLIENT] 📨 Received response from enclave");

    return {
      allowed: response.allowed ?? false,
      decision: response.decision || "ERROR",
      signature: response.signature,
      userOpHash: response.userOpHash,
      reason: response.reason,
      policyDecisions: response.policyDecisions,
    };
  }
}

export const enclaveClient = new EnclaveClientImpl();
export { EnclaveClientImpl };
