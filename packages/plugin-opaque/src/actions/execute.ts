import type {
    Action,
    ActionResult,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from '@elizaos/core';
import { logger } from '@elizaos/core';
import { enclaveClient } from '../enclave-client.js';
import { OpaqueWalletClient } from '../wallet-client.js';
import { encodeFunctionData, type Address } from 'viem';
import { OPAQUE_VERIFIER_ABI, ERC20_ABI } from '../contracts.js';

export const executeWithProofAction: Action = {
    name: 'EXECUTE_WITH_PROOF',
    similes: ['TRANSACT_WITH_POLICY', 'OPAQUE_TRANSFER', 'VERIFIED_EXECUTION'],
    description: 'Execute a blockchain transaction through the Opaque ZK policy system with agent\'s own wallet.',

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const userAddress = runtime.getSetting("OPAQUE_USER_ADDRESS");
        const installationId = runtime.getSetting("OPAQUE_INSTALLATION_ID");
        const agentPrivateKey = runtime.getSetting("AGENT_PRIVATE_KEY");
        const verifierAddress = runtime.getSetting("OPAQUE_VERIFIER_ADDRESS");
        const tokenAddress = runtime.getSetting("OPAQUE_TOKEN_ADDRESS");

        return !!(userAddress && installationId && agentPrivateKey && verifierAddress && tokenAddress);
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        _options: any,
        callback?: HandlerCallback
    ): Promise<ActionResult> => {
        try {
            logger.info("[OpaqueAction] Starting verified execution flow...");

            // Get current message content
            const currentContent = typeof message.content === 'string' ? message.content : (message.content as any).text || "";
            logger.info("[OpaqueAction] Current message:", currentContent);

            // Get conversation history from runtime
            const roomId = message.roomId;
            let fullContext = currentContent;
            
            try {
                // Fetch recent messages from the room to get full conversation context
                // Using runtime.getMemories() which is the correct ElizaOS API
                const recentMessages = await runtime.getMemories({
                    roomId: roomId,
                    count: 20,
                    unique: false,
                    tableName: "messages"
                });
                
                if (recentMessages && recentMessages.length > 0) {
                    // Combine all recent message texts
                    const conversationText = recentMessages
                        .map(m => {
                            const text = typeof m.content === 'string' ? m.content : (m.content as any).text || "";
                            return text;
                        })
                        .filter(t => t.length > 0)
                        .join("\n");
                    
                    fullContext = conversationText;
                    logger.info("[OpaqueAction] Using conversation history from runtime.getMemories()");
                    logger.info("[OpaqueAction] Recent messages count:", recentMessages.length);
                }
            } catch (error) {
                logger.warn("[OpaqueAction] Could not fetch conversation history:", error);
            }
            
            logger.info("[OpaqueAction] Full context length:", fullContext.length);
            logger.info("[OpaqueAction] Full context preview:", fullContext.substring(0, 500));

            // Search for address and amount in full conversation context
            const addressMatch = fullContext.match(/0x[a-fA-F0-9]{40}/);
            
            // Check if user explicitly specified wei
            const weiMatch = fullContext.match(/(\d+)\s*wei/i);
            // Match amounts with optional decimals
            const amountMatch = fullContext.match(/(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+tokens?/i) || 
                               fullContext.match(/(\d+(?:\.\d+)?)\s+tokens?\s+to/i) ||
                               fullContext.match(/(\d+(?:\.\d+)?)/);

            logger.info("[OpaqueAction] Address match:", addressMatch);
            logger.info("[OpaqueAction] Amount match:", amountMatch);
            logger.info("[OpaqueAction] Wei match:", weiMatch);

            if (!addressMatch || (!amountMatch && !weiMatch)) {
                const errorMsg = "Could not parse recipient address or amount from message.";
                if (callback) {
                    await callback({
                        text: errorMsg,
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: errorMsg,
                    error: new Error(errorMsg)
                };
            }

            const recipient = addressMatch[0].toLowerCase();
            
            // Smart amount parsing:
            // 1. If user explicitly says "wei", use that value directly
            // 2. If number has decimals (e.g., 0.1, 2.5), it's token units -> convert to wei
            // 3. If number is huge (>1e15) and no decimals, assume it's already wei
            // 4. Otherwise, treat as token units and convert to wei
            let amountInWei: string;
            
            if (weiMatch) {
                // User explicitly specified wei
                amountInWei = weiMatch[1];
                logger.info("[OpaqueAction] User specified wei directly:", amountInWei);
            } else {
                const rawAmount = amountMatch![1];
                const hasDecimals = rawAmount.includes('.');
                const numericValue = parseFloat(rawAmount);
                
                if (hasDecimals) {
                    // Has decimals -> definitely token units, convert to wei
                    // Use string math to avoid floating point precision issues
                    const [whole, decimal = ''] = rawAmount.split('.');
                    const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
                    amountInWei = BigInt(whole + paddedDecimal).toString();
                    logger.info("[OpaqueAction] Decimal amount -> wei:", rawAmount, "->", amountInWei);
                } else if (numericValue >= 1e15) {
                    // Very large integer without decimals -> likely already wei
                    amountInWei = BigInt(rawAmount).toString();
                    logger.info("[OpaqueAction] Large integer, treating as wei:", amountInWei);
                } else {
                    // Regular integer -> token units, convert to wei
                    amountInWei = BigInt(rawAmount + "000000000000000000").toString();
                    logger.info("[OpaqueAction] Integer token amount -> wei:", rawAmount, "->", amountInWei);
                }
            }
            
            const amount = amountInWei;

            const userAddress = runtime.getSetting("OPAQUE_USER_ADDRESS").toString();
            const installationId = parseInt(runtime.getSetting("OPAQUE_INSTALLATION_ID").toString());
            const enclaveUrl = runtime.getSetting("OPAQUE_ENCLAVE_URL") || "http://35.159.224.254:8001";
            const verifierAddress = runtime.getSetting("OPAQUE_VERIFIER_ADDRESS") as Address;
            const tokenAddress = runtime.getSetting("OPAQUE_TOKEN_ADDRESS") as Address;

            enclaveClient.setBaseUrl(enclaveUrl.toString());

            if (callback) {
                await callback({
                    text: `Requesting ZK proof from Enclave for installation ${installationId}...`,
                    source: message.content.source,
                });
            }

            const proofResponse = await enclaveClient.generateProof(
                userAddress,
                installationId,
                {
                    amount,
                    recipient,
                    timestamp: Math.floor(Date.now() / 1000),
                    userAddress
                }
            );

            logger.info("[OpaqueAction] Proof response success:", proofResponse.success);

            if (!proofResponse.success) {
                const errorMsg = `Policy check failed or proof generation error: ${(proofResponse as any).error || 'Unknown error'}`;
                if (callback) {
                    await callback({
                        text: errorMsg,
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: errorMsg,
                    error: new Error(errorMsg)
                };
            }

            const { proof, publicInputs } = proofResponse;
            
            // Add 0x prefix to proof if missing (enclave returns plain hex)
            const formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;

            if (callback) {
                await callback({
                    text: "ZK proof generated. Encoding ERC20 transfer from vault...",
                    source: message.content.source,
                });
            }

            const walletClient = new OpaqueWalletClient(
                runtime.getSetting("AGENT_PRIVATE_KEY").toString()
            );

            await walletClient.initialize();
            
            const agentAddress = walletClient.getAddress();
            const balance = await walletClient.getBalance();
            
            logger.info(`[OpaqueAction] Agent wallet: ${agentAddress}`);
            logger.info(`[OpaqueAction] Balance: ${balance} wei`);
            
            const MIN_BALANCE = BigInt("10000000000000000"); // 0.01 MNT
            if (balance < MIN_BALANCE) {
                const warningMsg = `⚠️ Low balance warning: Agent wallet has insufficient MNT for gas. Please fund ${agentAddress}`;
                if (callback) {
                    await callback({
                        text: warningMsg,
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: warningMsg,
                    error: new Error("Insufficient balance for gas")
                };
            }

            const targetAddress = recipient as Address;
            
            // Encode ERC20 transfer call (vault transfers to recipient)
            const transferCalldata = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: "transfer",
                args: [targetAddress, BigInt(amount)]
            });

            // Encode verifyAndExecute call
            const callData = encodeFunctionData({
                abi: OPAQUE_VERIFIER_ABI,
                functionName: "verifyAndExecute",
                args: [
                    formattedProof as `0x${string}`,
                    publicInputs.policySatisfied as `0x${string}`,
                    publicInputs.nullifier as `0x${string}`,
                    publicInputs.userAddressHash as `0x${string}`,
                    tokenAddress,
                    transferCalldata
                ]
            });

            if (callback) {
                await callback({
                    text: "Signing and submitting transaction...",
                    source: message.content.source,
                });
            }

            const txHash = await walletClient.signTransaction({
                to: verifierAddress,
                data: callData
            });

            // Format amount for display (convert wei back to tokens)
            const displayAmount = (BigInt(amount) / BigInt("1000000000000000000")).toString() + 
                (BigInt(amount) % BigInt("1000000000000000000") > 0 ? 
                    "." + (BigInt(amount) % BigInt("1000000000000000000")).toString().padStart(18, '0').replace(/0+$/, '') : '');
            
            const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${txHash}`;
            const successMsg = `✅ Transaction executed successfully!\n\n` +
                `**Amount:** ${displayAmount} tokens\n` +
                `**Recipient:** ${recipient}\n` +
                `**Explorer:** [View on Mantle Sepolia](${explorerUrl})`;

            if (callback) {
                await callback({
                    text: successMsg,
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: successMsg,
                data: { txHash, amount, recipient, vault: verifierAddress, token: tokenAddress, explorerUrl }
            };
        } catch (error: any) {
            logger.error("[OpaqueAction] Handler failed:", error);
            const errorMsg = `Opaque Action Error: ${error.message}`;

            if (callback) {
                await callback({
                    text: errorMsg,
                    source: message.content.source,
                });
            }

            return {
                success: false,
                text: errorMsg,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },

    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Send 10 tokens to 0xcb3b302248cbee4f9b42c09c5adbc841c4fafc2f",
                    source: "direct"
                }
            },
            {
                name: "{{agentName}}",
                content: {
                    text: "I'll execute that transfer via Opaque vault. Generating ZK proof...",
                    actions: ["EXECUTE_WITH_PROOF"],
                    source: "direct"
                }
            }
        ]
    ]
};