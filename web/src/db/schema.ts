import { pgTable, serial, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const sessionAccounts = pgTable('session_accounts', {
  id: serial('id').primaryKey(),
  sessionAccountId: text('session_account_id').notNull().unique(),
  address: text('address').notNull().unique(),
  userAddress: text('user_address').notNull(),
  adapterId: text('adapter_id').notNull(),
  deployParams: jsonb('deploy_params').notNull(),
  // encryptedPrivateKey removed - keys stored only in enclave memory
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  permissionType: text('permission_type').notNull(),
  tokenAddress: text('token_address'),
  delegationHash: text('delegation_hash').notNull(),
  delegationData: jsonb('delegation_data').notNull(),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
});

export const installedAdapters = pgTable('installed_adapters', {
  id: serial('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  adapterId: text('adapter_id').notNull(),
  config: jsonb('config').notNull(),
  permissionId: integer('permission_id').references(() => permissions.id),
  isActive: boolean('is_active').notNull().default(true),
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

export const securityAlerts = pgTable('security_alerts', {
  id: serial('id').primaryKey(),
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});
