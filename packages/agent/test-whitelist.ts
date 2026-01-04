/**
 * Test script to verify whitelisting policy behavior
 * 
 * This script tests:
 * 1. Whitelisting an address and sending to it - should ALLOW
 * 2. Whitelisting an address and sending to a different address - should BLOCK
 */

import { recipientWhitelistRule } from "./packages/agent/src/policies/rules/recipient-whitelist.js";
import { encodeFunctionData, parseUnits } from "viem";
import type { PolicyContext } from "./packages/agent/src/policies/types.js";

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Test addresses
const WHITELISTED_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as `0x${string}`;
const NON_WHITELISTED_ADDRESS = "0x8ba1f109551bD432803012645Hac136c22C929b" as `0x${string}`;

async function testWhitelist() {
  console.log("🧪 Testing Whitelisting Policy\n");
  console.log("=" .repeat(60));

  // Create a mock context
  const createContext = (recipient: `0x${string}`): PolicyContext => {
    const amount = parseUnits("0.1", 6);
    const callData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, amount],
    });

    return {
      userAddress: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      adapterId: "transfer-bot",
      proposedTx: {
        target: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
        value: 0n,
        callData,
        description: `Transfer to ${recipient}`,
      },
      signals: {},
      timestamp: new Date(),
    };
  };

  // Test 1: Whitelisted address should ALLOW
  console.log("\n✅ Test 1: Sending to WHITELISTED address");
  console.log(`   Whitelist: [${WHITELISTED_ADDRESS}]`);
  console.log(`   Recipient: ${WHITELISTED_ADDRESS}`);
  
  const config1 = {
    allowed: [WHITELISTED_ADDRESS],
    blocked: [],
  };

  const context1 = createContext(WHITELISTED_ADDRESS);
  const result1 = await recipientWhitelistRule.evaluate(context1, config1);

  console.log(`   Result: ${result1.allowed ? "✅ ALLOW" : "❌ BLOCK"}`);
  console.log(`   Reason: ${result1.reason}`);
  
  if (!result1.allowed) {
    console.error("   ❌ FAILED: Whitelisted address should be allowed!");
    process.exit(1);
  }
  console.log("   ✅ PASSED");

  // Test 2: Non-whitelisted address should BLOCK
  console.log("\n❌ Test 2: Sending to NON-WHITELISTED address");
  console.log(`   Whitelist: [${WHITELISTED_ADDRESS}]`);
  console.log(`   Recipient: ${NON_WHITELISTED_ADDRESS}`);
  
  const config2 = {
    allowed: [WHITELISTED_ADDRESS],
    blocked: [],
  };

  const context2 = createContext(NON_WHITELISTED_ADDRESS);
  const result2 = await recipientWhitelistRule.evaluate(context2, config2);

  console.log(`   Result: ${result2.allowed ? "✅ ALLOW" : "❌ BLOCK"}`);
  console.log(`   Reason: ${result2.reason}`);
  
  if (result2.allowed) {
    console.error("   ❌ FAILED: Non-whitelisted address should be blocked!");
    process.exit(1);
  }
  console.log("   ✅ PASSED");

  // Test 3: Empty whitelist should ALLOW all
  console.log("\n✅ Test 3: Empty whitelist (no restrictions)");
  console.log(`   Whitelist: []`);
  console.log(`   Recipient: ${NON_WHITELISTED_ADDRESS}`);
  
  const config3 = {
    allowed: [],
    blocked: [],
  };

  const context3 = createContext(NON_WHITELISTED_ADDRESS);
  const result3 = await recipientWhitelistRule.evaluate(context3, config3);

  console.log(`   Result: ${result3.allowed ? "✅ ALLOW" : "❌ BLOCK"}`);
  console.log(`   Reason: ${result3.reason}`);
  
  if (!result3.allowed) {
    console.error("   ❌ FAILED: Empty whitelist should allow all!");
    process.exit(1);
  }
  console.log("   ✅ PASSED");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All tests passed! Whitelisting policy is working correctly.");
  console.log("\n📝 Summary:");
  console.log("   • Whitelisted addresses → ✅ ALLOWED");
  console.log("   • Non-whitelisted addresses → ❌ BLOCKED");
  console.log("   • Empty whitelist → ✅ ALLOWED (no restrictions)");
}

testWhitelist().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

