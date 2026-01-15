import { z } from "zod";
import { encodeFunctionData, parseUnits } from "viem";
import type {
    Adapter,
    AdapterContext,
    ProposedTransaction,
    TriggerConfig,
} from "./types.js";

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

// Default to a Mock Token on Sepolia or Mantle Sepolia if known, otherwise user must provide
// For now using the address from the old transfer-bot as default if valid, or just partial
const DEFAULT_TOKEN_ADDRESS = "0xdeadbeef00000000000000000000000000000000";

const configSchema = z.object({
    tokenAddress: z.string().default(DEFAULT_TOKEN_ADDRESS),
    recipient: z.string(),
    amount: z.string().default("1.0"),
    decimals: z.number().default(18),
});

export type MantleTransferConfig = z.infer<typeof configSchema>;

export const mantleTransferAdapter: Adapter = {
    id: "mantle-transfer",
    name: "Mantle Transfer",
    description: "Transfers ERC20 tokens on Mantle. Aligned with OpaqueVerifier verification.",
    icon: "💸",
    version: "1.0.0",
    author: "opaque",
    requiredPermissions: [],
    triggers: [{ type: "manual" }] as TriggerConfig[],
    configSchema,

    validateConfig(config: unknown): boolean {
        try {
            configSchema.parse(config);
            return true;
        } catch {
            return false;
        }
    },

    async proposeTransaction(
        context: AdapterContext
    ): Promise<ProposedTransaction | null> {
        const config = configSchema.parse(context.config);

        // Allow runtime params to override
        const recipient = context.runtimeParams?.recipient || config.recipient;
        const amountStr = context.runtimeParams?.amount || config.amount;

        if (!recipient) {
            throw new Error("Recipient address is required");
        }

        const tokenAddress = config.tokenAddress;
        const decimals = config.decimals;
        const amount = parseUnits(amountStr, decimals);

        const callData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [recipient as `0x${string}`, amount],
        });

        return {
            target: tokenAddress as `0x${string}`,
            value: 0n,
            callData,
            description: `Transfer ${amountStr} tokens to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
            tokenAddress,
            tokenAmount: amount,
            recipient,
        };
    },
};
