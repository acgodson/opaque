import type {
  Plugin,
  IAgentRuntime,
} from '@elizaos/core';
import { logger } from '@elizaos/core';
import { z } from 'zod';
import { executeWithProofAction } from './actions/execute.js';

const configSchema = z.object({
  OPAQUE_USER_ADDRESS: z
    .string()
    .min(1, 'OPAQUE_USER_ADDRESS is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  OPAQUE_INSTALLATION_ID: z
    .string()
    .min(1, 'OPAQUE_INSTALLATION_ID is required'),
  AGENT_PRIVATE_KEY: z
    .string()
    .min(1, 'AGENT_PRIVATE_KEY is required')
    .regex(/^(0x)?[a-fA-F0-9]{64}$/, 'Invalid private key format'),
  OPAQUE_VERIFIER_ADDRESS: z
    .string()
    .min(1, 'OPAQUE_VERIFIER_ADDRESS is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'),
  OPAQUE_TOKEN_ADDRESS: z
    .string()
    .min(1, 'OPAQUE_TOKEN_ADDRESS is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'),
  OPAQUE_ENCLAVE_URL: z
    .string()
    .url('Invalid enclave URL format')
    .optional()
    .default('http://35.159.224.254:8001'),
});

export const opaquePlugin: Plugin = {
  name: 'opaque',
  description: 'ZK policy-based transaction execution plugin for ElizaOS',
  config: {
    OPAQUE_USER_ADDRESS: process.env.OPAQUE_USER_ADDRESS,
    OPAQUE_INSTALLATION_ID: process.env.OPAQUE_INSTALLATION_ID,
    AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY,
    OPAQUE_VERIFIER_ADDRESS: process.env.OPAQUE_VERIFIER_ADDRESS,
    OPAQUE_TOKEN_ADDRESS: process.env.OPAQUE_TOKEN_ADDRESS,
    OPAQUE_ENCLAVE_URL: process.env.OPAQUE_ENCLAVE_URL,
  },
  async init(_config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info('Initializing Opaque plugin...');
    
    try {
      if (!process.env.AGENT_PRIVATE_KEY) {
        logger.warn("AGENT_PRIVATE_KEY is not set in environment - Opaque functionality will be limited");
        return;
      }

      const pluginConfig = {
        OPAQUE_USER_ADDRESS: process.env.OPAQUE_USER_ADDRESS,
        OPAQUE_INSTALLATION_ID: process.env.OPAQUE_INSTALLATION_ID,
        AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY,
        OPAQUE_VERIFIER_ADDRESS: process.env.OPAQUE_VERIFIER_ADDRESS,
        OPAQUE_TOKEN_ADDRESS: process.env.OPAQUE_TOKEN_ADDRESS,
        OPAQUE_ENCLAVE_URL: process.env.OPAQUE_ENCLAVE_URL || 'http://35.159.224.254:8001',
      };

      const validatedConfig = await configSchema.parseAsync(pluginConfig);
      logger.info('✓ Opaque plugin initialized successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues?.map((e) => `${e.path.join('.')}: ${e.message}`)?.join(', ') || 'Unknown validation error';
        logger.warn(`Opaque plugin configuration issue: ${errorMessages} - You need to configure the Opaque environment variables`);
      } else {
        logger.warn(`Opaque plugin configuration issue: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  },
  actions: [executeWithProofAction],
  providers: [],
  evaluators: [],
  services: [],
};

export default opaquePlugin;