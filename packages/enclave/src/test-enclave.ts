import { handleRequest } from "./handler.js";
import type { EnclaveRequest } from "./protocol.js";
import { initializeNoir } from "./init-noir.js";
import { proofService } from "./proof-service.js";

async function testEnclave() {
    console.log("=== Enclave Test Suite ===\n");

    // Initialize Noir circuit
    console.log("Initializing Noir...");
    const { noir, backend } = await initializeNoir();
    await proofService.initialize({ noir, backend });
    console.log("✓ Proof service ready\n");

    console.log("Test 1: Health Check");
    const healthCheck: EnclaveRequest = {
        type: "HEALTH_CHECK",
    };
    const healthResponse = await handleRequest(healthCheck);
    console.log("Response:", healthResponse);
    console.log("✓ Health check passed\n");

    console.log("Test 2: Store Policy Config");
    const storePolicy: EnclaveRequest = {
        type: "STORE_POLICY_CONFIG",
        userAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        policyConfig: {
            maxAmount: {
                enabled: true,
                limit: 100_000_000,
            },
            timeWindow: {
                enabled: true,
                startHour: 9,
                endHour: 17,
            },
        },
    };
    const storeResponse = await handleRequest(storePolicy);
    console.log("Response:", storeResponse);
    console.log("✓ Policy stored\n");

    console.log("Test 3: Health Check (should show 1 policy)");
    const healthCheck2 = await handleRequest(healthCheck);
    console.log("Response:", healthCheck2);
    console.log("✓ Policy count updated\n");

    console.log("Test 4: Generate Proof");

    // Set timestamp to 12:00 UTC today to ensure it's within the 9-17 window
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);
    const validTimestamp = Math.floor(now.getTime() / 1000);

    const generateProof: EnclaveRequest = {
        type: "GENERATE_PROOF",
        userAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        txData: {
            amount: "50000000",
            recipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            timestamp: validTimestamp,
            userAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        },
    };
    const proofResponse = await handleRequest(generateProof);
    console.log("Response:", proofResponse);

    if ("success" in proofResponse && proofResponse.success && "proof" in proofResponse) {
        console.log("✓ Proof generated successfully");
        console.log(`  Proof length: ${proofResponse.proof.length} chars`);
        console.log(`  Nullifier: ${proofResponse.publicInputs.nullifier}`);
        console.log(`  Policy Satisfied: ${proofResponse.publicInputs.policySatisfied}`);
    } else if ("success" in proofResponse && !proofResponse.success) {
        console.log("✗ Proof generation failed:", proofResponse.error);
    }

    console.log("\n=== All Tests Complete ===");
}

testEnclave().catch(console.error);

