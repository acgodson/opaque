import type { ProposedTransaction } from "@opaque/agent";
import axios from "axios";

class EnclaveClientImpl {
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

    try {
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

  async storePolicyConfig(userAddress: string, installationId: number, policyConfig: any): Promise<{ success: boolean; message: string }> {
    const response = await this.sendRequest({
      type: "STORE_POLICY_CONFIG",
      userAddress,
      installationId,
      policyConfig,
    });
    return response;
  }

  async generateProof(request: {
    userAddress: string;
    installationId: number;
    txData: {
      amount: string;
      recipient: string;
      timestamp: number;
      userAddress: string;
    };
  }): Promise<{
    success: boolean;
    proof: string;
    publicInputs: {
      policySatisfied: string;
      nullifier: string;
      userAddressHash: string;
    };
  }> {
    const enclaveRequest = {
      type: "GENERATE_PROOF",
      userAddress: request.userAddress,
      installationId: request.installationId,
      txData: request.txData,
    };

    console.log(`[ENCLAVE CLIENT] Generating proof for ${request.userAddress}:${request.installationId}`);
    const response = await this.sendRequest(enclaveRequest);

    return {
      success: response.success,
      proof: response.proof,
      publicInputs: response.publicInputs,
    };
  }
}

export const enclaveClient = new EnclaveClientImpl();
export { EnclaveClientImpl };
