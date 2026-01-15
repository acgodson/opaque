import axios, { type AxiosError, type AxiosInstance } from "axios";
import type {
    EnclaveRequest,
    EnclaveResponse,
    HealthCheckResponse,
    StorePolicyConfigResponse,
    GenerateProofResponse,
    GenerateProofRequest,
    StorePolicyConfigRequest
} from "./types.js";

export class OpaqueEnclaveClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl: string = "http://localhost:8000") {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 60000,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    setBaseUrl(url: string) {
        this.baseUrl = url;
        this.client.defaults.baseURL = url;
    }

    async sendRequest<T extends EnclaveResponse>(request: EnclaveRequest): Promise<T> {
        try {
            console.log(`[EnclaveClient] Sending ${request.type} to ${this.baseUrl}`);
            const response = await this.client.post<T>("/", request);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("[EnclaveClient] Request failed:", {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message
                });
                throw new Error(`Enclave request failed: ${axiosError.message}`);
            }
            throw error;
        }
    }

    async healthCheck(): Promise<HealthCheckResponse> {
        return this.sendRequest<HealthCheckResponse>({
            type: "HEALTH_CHECK"
        });
    }

    async storePolicy(
        userAddress: string,
        installationId: number,
        policyConfig: any
    ): Promise<StorePolicyConfigResponse> {
        const request: StorePolicyConfigRequest = {
            type: "STORE_POLICY_CONFIG",
            userAddress,
            installationId,
            policyConfig
        };
        return this.sendRequest<StorePolicyConfigResponse>(request);
    }

    async generateProof(
        userAddress: string,
        installationId: number,
        txData: GenerateProofRequest["txData"]
    ): Promise<GenerateProofResponse> {
        const request: GenerateProofRequest = {
            type: "GENERATE_PROOF",
            userAddress,
            installationId,
            txData
        };
        return this.sendRequest<GenerateProofResponse>(request);
    }
}

export const enclaveClient = new OpaqueEnclaveClient();
