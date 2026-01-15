import type { EnclaveRequest, EnclaveResponse } from "./protocol.js";
import { proofService } from "./proof-service.js";
import { policyStore } from "./policy-store.js";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

export async function handleRequest(request: EnclaveRequest): Promise<EnclaveResponse> {
  if (request.type === "HEALTH_CHECK") {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      policyCount: policyStore.getPolicyCount(),
    };
  }

  if (request.type === "DIAGNOSTICS") {
    try {
      const diagnostics: any = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH,
        },
      };

      try {
        diagnostics.devShm = execSync("df -h /dev/shm").toString();
      } catch (e) {
        diagnostics.devShm = "Not available: " + String(e);
      }

      try {
        diagnostics.mounts = execSync("mount | grep shm").toString();
      } catch (e) {
        diagnostics.mounts = "No shm mounts";
      }

      try {
        diagnostics.bbVersion = execSync("bb --version").toString();
      } catch (e) {
        diagnostics.bbVersion = "bb not found: " + String(e);
      }

      try {
        if (existsSync("/proc/meminfo")) {
          diagnostics.meminfo = readFileSync("/proc/meminfo", "utf-8");
        }
      } catch (e) {
        diagnostics.meminfo = "Not available";
      }

      return {
        success: true,
        diagnostics,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  if (request.type === "TEST_BB") {
    try {
      console.log("[HANDLER] Testing bb.js step by step...");
      
      console.log("[HANDLER] Step 1: Import Barretenberg");
      const { Barretenberg, Fr } = await import("@aztec/bb.js");
      console.log("[HANDLER] ✓ Barretenberg imported");

      console.log("[HANDLER] Step 2: Create Barretenberg instance (single-threaded)");
      const bb = await Barretenberg.new({ threads: 1 });
      console.log("[HANDLER] ✓ Barretenberg instance created");

      console.log("[HANDLER] Step 3: Create Fr elements");
      const fr1 = new Fr(BigInt(123));
      const fr2 = new Fr(BigInt(456));
      console.log("[HANDLER] ✓ Fr elements created");

      console.log("[HANDLER] Step 4: Compute Pedersen hash");
      const hash = await bb.pedersenHash([fr1, fr2], 0);
      console.log("[HANDLER] ✓ Pedersen hash computed:", hash.toString().substring(0, 20) + "...");

      console.log("[HANDLER] Step 5: Destroy Barretenberg");
      await bb.destroy();
      console.log("[HANDLER] ✓ Barretenberg destroyed");

      return {
        success: true,
        message: "bb.js test passed",
        hash: hash.toString(),
      };
    } catch (error) {
      console.error("[HANDLER] ❌ bb.js test failed:", error);
      return {
        success: false,
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  }

  if (request.type === "STORE_POLICY_CONFIG") {
    policyStore.store(request.userAddress, request.installationId, request.policyConfig);
    return {
      success: true,
      message: `Policy config stored for ${request.userAddress}:${request.installationId}`,
    };
  }

  if (request.type === "GENERATE_PROOF") {
    console.log("[HANDLER] Received GENERATE_PROOF request");
    console.log("[HANDLER] User:", request.userAddress);
    console.log("[HANDLER] Installation ID:", request.installationId);
    console.log("[HANDLER] TX amount:", request.txData.amount);
    console.log("[HANDLER] TX recipient:", request.txData.recipient);
    
    try {
      console.log("[HANDLER] Converting transaction data");
      const txData = {
        amount: BigInt(request.txData.amount),
        recipient: request.txData.recipient,
        timestamp: request.txData.timestamp,
        userAddress: request.txData.userAddress,
      };
      console.log("[HANDLER] Transaction data converted successfully");

      console.log("[HANDLER] Calling proof service");
      const result = await proofService.generateProof(
        request.userAddress,
        request.installationId,
        txData
      );
      console.log("[HANDLER] Proof service returned successfully");

      console.log("[HANDLER] Converting proof to hex");
      const proofHex = Buffer.from(result.proof).toString('hex');
      console.log("[HANDLER] Proof hex length:", proofHex.length);

      console.log("[HANDLER] Returning success response");
      return {
        success: true,
        proof: proofHex,
        publicInputs: result.publicInputs,
      };
    } catch (error) {
      console.error("[HANDLER] ❌ Error in GENERATE_PROOF:", error);
      console.error("[HANDLER] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[HANDLER] Error stack:", error instanceof Error ? error.stack : "No stack");
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { success: false, error: "Unknown request type" };
}
