import { pgTable, serial, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const installedAdapters = pgTable('installed_adapters', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  adapterId: text('adapter_id').notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  deploymentUrl: text('deployment_url'),
  tokenAddress: text('token_address'),
  tokenSymbol: text('token_symbol'),
  tokenDecimals: integer('token_decimals'),
  lastRun: timestamp('last_run'),
  installedAt: timestamp('installed_at').notNull().defaultNow(),
});

export const userPolicies = pgTable('user_policies', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  policyType: text('policy_type').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  config: jsonb('config').notNull(),
  adapterId: text('adapter_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const executionLogs = pgTable('execution_logs', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  adapterId: text('adapter_id').notNull(),
  proposedTx: jsonb('proposed_tx').notNull(),
  decision: text('decision').notNull(),
  reason: text('reason'),
  policyResults: jsonb('policy_results'),
  txHash: text('tx_hash'),
  executedAt: timestamp('executed_at').notNull().defaultNow(),
});

export const proofLogs = pgTable('proof_logs', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  adapterId: integer('adapter_id').notNull(),
  nullifier: text('nullifier').notNull(),
  txHash: text('tx_hash'),
  amount: text('amount').notNull(),
  recipient: text('recipient').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
