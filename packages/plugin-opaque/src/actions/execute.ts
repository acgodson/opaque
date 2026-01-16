import type {
    Action,
    ActionResult,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from '@elizaos/core';
import { logger, ModelType } from '@elizaos/core';
import { enclaveClient } from '../enclave-client.js';
import { OpaqueWalletClient } from '../wallet-client.js';
import { encodeFunctionData, type Address } from 'viem';
import { OPAQUE_VERIFIER_ABI, ERC20_ABI } from '../contracts.js';

async function parseTransferRequest(runtime: IAgentRuntime, content: string): Promise<{ recipient?: string; amount?: string }> {
    const prompt = `Extract the recipient address and amount from this transfer request. Return JSON only.

Message: "${content}"

Return format:
{
  "recipient": "0x...", // ethereum address or null if not found
  "amount": "123.45" // numeric amount or null if not found
}

Rules:
- Only extract valid ethereum addresses (0x followed by 40 hex chars)
- Extract numeric amounts (can be decimal)
- Return null for missing values
- No explanations, just JSON`;

    const response = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt,
        temperature: 0.1,
    });

    const parsed = JSON.parse(response);
    return {
        recipient: parsed.recipient?.toLowerCase(),
        amount: parsed.amount
    };
}

function convertToWei(amountStr: string): string {
    const amount = parseFloat(amountStr);
    if (amountStr.includes('.')) {
        // Decimal amount - convert to wei using string math
        const [whole, decimal = ''] = amountStr.split('.');
        const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
        return BigInt(whole + paddedDecimal).toString();
    } else if (amount >= 1e15) {
        // Very large number - assume already wei
        return BigInt(amountStr).toString();
    } else {
        // Regular number - convert tokens to wei
        return BigInt(amountStr + "000000000000000000").toString();
    }
}

function formatDisplayAmount(weiAmount: string): string {
    const tokens = BigInt(weiAmount) / BigInt("1000000000000000000");
    const remainder = BigInt(weiAmount) % BigInt("1000000000000000000");

    if (remainder > 0) {
        const decimal = remainder.toString().padStart(18, '0').replace(/0+$/, '');
        return `${tokens}.${decimal}`;
    }
    return tokens.toString();
}

export const executeWithProofAction: Action = {
    name: 'EXECUTE_WITH_PROOF',
    similes: ['TRANSACT_WITH_POLICY', 'OPAQUE_TRANSFER', 'VERIFIED_EXECUTION'],
    description: 'Execute a blockchain transaction through the Opaque ZK policy system.',

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        return !!(
            process.env.OPAQUE_USER_ADDRESS &&
            process.env.OPAQUE_INSTALLATION_ID &&
            process.env.AGENT_PRIVATE_KEY &&
            process.env.OPAQUE_VERIFIER_ADDRESS &&
            process.env.OPAQUE_TOKEN_ADDRESS
        );
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        _options: any,
        callback?: HandlerCallback
    ): Promise<ActionResult> => {
        try {
            // Parse message content using LLM
            const content = typeof message.content === 'string' ? message.content : (message.content as any).text || "";
            const { recipient, amount } = await parseTransferRequest(runtime, content);

            if (!recipient || !amount) {
                const errorMsg = "I need both a recipient address and amount. Try: 'Send 50 MCK to 0x...'";
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

            // Convert amount to wei
            const amountInWei = convertToWei(amount);

            // Get configuration from environment
            const userAddress = process.env.OPAQUE_USER_ADDRESS!;
            const installationId = parseInt(process.env.OPAQUE_INSTALLATION_ID!);
            const enclaveUrl = process.env.OPAQUE_ENCLAVE_URL;
            const verifierAddress = process.env.OPAQUE_VERIFIER_ADDRESS! as Address;
            const tokenAddress = process.env.OPAQUE_TOKEN_ADDRESS! as Address;

            // Request ZK proof
            if (callback) {
                await callback({
                    text: "🔐 Generating ZK proof...",
                    source: message.content.source,
                });
            }

            enclaveClient.setBaseUrl(enclaveUrl);
            const proofResponse = await enclaveClient.generateProof(
                userAddress,
                installationId,
                {
                    amount: amountInWei,
                    recipient,
                    timestamp: Math.floor(Date.now() / 1000),
                    userAddress
                }
            );

            if (!proofResponse.success) {
                const errorMsg = "❌ Policy check failed: Transaction blocked by vault rules";
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

            // Prepare transaction
            if (callback) {
                await callback({
                    text: "📝 Preparing transaction...",
                    source: message.content.source,
                });
            }

            const { proof, publicInputs } = proofResponse;
            const formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;

            // Initialize wallet
            const walletClient = new OpaqueWalletClient(process.env.AGENT_PRIVATE_KEY!);
            await walletClient.initialize();

            const balance = await walletClient.getBalance();
            const MIN_BALANCE = BigInt("10000000000000000"); // 0.01 MNT

            if (balance < MIN_BALANCE) {
                const errorMsg = `❌ Insufficient gas: Agent wallet needs more MNT (current: ${balance} wei)`;
                if (callback) {
                    await callback({
                        text: errorMsg,
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: errorMsg,
                    error: new Error("Insufficient balance for gas")
                };
            }

            // Encode transaction data
            const transferCalldata = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: "transfer",
                args: [recipient as Address, BigInt(amountInWei)]
            });

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

            // Submit transaction
            if (callback) {
                await callback({
                    text: "🚀 Submitting transaction...",
                    source: message.content.source,
                });
            }

            const txHash = await walletClient.signTransaction({
                to: verifierAddress,
                data: callData
            });

            // Success response
            const displayAmount = formatDisplayAmount(amountInWei);
            const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${txHash}`;
            const successMsg = `✅ **Transfer Complete!**\n\n` +
                `💰 **Amount:** ${displayAmount} MCK\n` +
                `📍 **To:** ${recipient}\n` +
                `🔗 **Explorer:** [View Transaction](${explorerUrl})`;

            if (callback) {
                await callback({
                    text: successMsg,
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: successMsg,
                data: { txHash, amount: amountInWei, recipient, explorerUrl }
            };

        } catch (error: any) {
            logger.error("[OpaqueAction] Transaction failed:", error.message);

            // Clean error messages
            let errorMsg = "❌ Transaction failed";

            if (error.message?.includes("insufficient funds")) {
                errorMsg = "❌ Insufficient funds: Agent wallet needs more MNT for gas";
            } else if (error.message?.includes("Policy check failed")) {
                errorMsg = "❌ Policy violation: Transaction blocked by vault rules";
            } else if (error.message?.includes("Could not parse")) {
                errorMsg = "❌ Invalid format: Use 'Send 50 USDC to 0x...'";
            }

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
    },

    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Send 50 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                    source: "direct"
                }
            },
            {
                name: "{{agentName}}",
                content: {
                    text: "🔐 Generating ZK proof...",
                    actions: ["EXECUTE_WITH_PROOF"],
                    source: "direct"
                }
            }
        ]
    ]
};