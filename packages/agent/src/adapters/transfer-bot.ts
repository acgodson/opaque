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

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

const configSchema = z.object({
  tokenType: z.enum(["USDC", "ETH"]).default("USDC"),
  tokenAddress: z.string().optional(),
  recipient: z.string().optional(),
  amountPerTransfer: z.string().default("0.1"),
  maxAmountPerPeriod: z.string().default("1.0"),
  period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  decimals: z.number().optional(),
});

export type TransferBotConfig = z.infer<typeof configSchema>;

export const transferBotAdapter: Adapter = {
  id: "transfer-bot",
  name: "Transfer Bot",
  description:
    "Transfers 0.1 USDC or 0.1 ETH per execution. The amount you set is the maximum allowed per period (daily/weekly/monthly). Configure policies to control spending limits and recipient whitelists.",
  icon: "💸",
  version: "1.0.0",
  author: "0xVisor",
  requiredPermissions: [],

  triggers: [
    { type: "cron", schedule: "0 9 * * *" },
    { type: "manual" },
  ] as TriggerConfig[],

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

    const recipient = context.runtimeParams?.recipient || config.recipient;
    if (!recipient) {
      throw new Error("Recipient address is required");
    }

    const tokenType = config.tokenType || "USDC";
    const isNative = tokenType === "ETH";

    if (isNative) {
      const amount = parseUnits(config.amountPerTransfer, 18);
      return {
        target: recipient as `0x${string}`,
        value: amount,
        callData: "0x" as `0x${string}`,
        description: `Transfer ${config.amountPerTransfer} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
        tokenAddress: NATIVE_TOKEN_ADDRESS,
        tokenAmount: amount,
        recipient,
      };
    } else {
      const tokenAddress = config.tokenAddress || USDC_ADDRESS;
      const decimals = config.decimals || 6;
      const amount = parseUnits(config.amountPerTransfer, decimals);

      const callData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amount],
      });

      return {
        target: tokenAddress as `0x${string}`,
        value: 0n,
        callData,
        description: `Transfer ${config.amountPerTransfer} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
        tokenAddress,
        tokenAmount: amount,
        recipient,
      };
    }
  },
};
