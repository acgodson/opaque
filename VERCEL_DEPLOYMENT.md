# Vercel Deployment Guide

## ✅ Monorepo Setup Complete

Your project is configured as a **pnpm workspace monorepo**:
- Root: `/` (contains pnpm-workspace.yaml)
- Packages: `packages/agent` (stateless SDK)
- Web: `web` (Next.js app)

## Pre-Deployment Checklist

✅ Migration Complete:
- Express + SQLite → tRPC + Postgres
- Agent package is stateless
- All routes migrated to tRPC
- Workspace configured with `workspace:*` dependencies
- Build passes locally

## Step 1: Prepare Repository

1. Commit all changes:
```bash
cd /Users/godson/Desktop/0xvisor
git init  # if not already initialized
git add .
git commit -m "Prepare for Vercel deployment with monorepo setup"
```

2. Push to GitHub (create repo first on github.com):
```bash
git remote add origin https://github.com/YOUR_USERNAME/0xvisor.git
git push -u origin main
```

## Step 2: Set Up Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **IMPORTANT:** Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (LEAVE EMPTY - use monorepo root)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `web/.next`
   - **Install Command**: `pnpm install`

**Why root directory should be empty:**
- Your `vercel.json` is at the root
- pnpm workspace needs access to both `/packages/agent` and `/web`
- The build command handles building in the correct order

## Step 3: Set Up Vercel Postgres

1. In your Vercel project dashboard:
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose a region close to your users
   - Click "Create"

2. Go to ".env.local" tab in the Postgres dashboard
3. Vercel will automatically inject these into your environment

The following variables will be auto-configured:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

## Step 4: Add Custom Environment Variables

In your Vercel project settings → Environment Variables, add:

```
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ENCRYPTION_KEY=your-32-character-encryption-key-here

NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

ENVIO_GRAPHQL_URL=your-envio-url (optional)
PIMLICO_API_KEY=your-pimlico-key (optional)
```

**Important:** Use the same `ENCRYPTION_KEY` that you used locally to ensure session keys can be decrypted.

## Step 5: Initialize Database Schema

After first deployment, create the tables:

### Using Vercel Postgres Dashboard
1. Go to your Vercel Postgres database
2. Click "Query" tab
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS session_accounts (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  user_address TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  deploy_params JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  permission_type TEXT NOT NULL,
  token_address TEXT,
  delegation_hash TEXT NOT NULL,
  delegation_data JSONB NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS installed_adapters (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  config JSONB NOT NULL,
  permission_id INTEGER REFERENCES permissions(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP,
  installed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_policies (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL,
  adapter_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  proposed_tx JSONB NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  policy_results JSONB,
  tx_hash TEXT,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id SERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

## Step 6: Deploy!

1. Push to your repository:
```bash
git push origin main
```

2. Vercel will automatically:
   - Install pnpm dependencies (workspace-aware)
   - Build `@0xvisor/agent` package first
   - Build `@0xvisor/web` Next.js app
   - Deploy to production

3. Monitor the build in Vercel dashboard
4. Your app will be live at: `https://your-project.vercel.app`

## Build Process Explained

The build happens in this order (configured in root `package.json`):

```json
{
  "scripts": {
    "build": "pnpm --filter @0xvisor/agent build && pnpm --filter @0xvisor/web build"
  }
}
```

1. **Agent Package Build**: Compiles TypeScript → JavaScript in `packages/agent/dist/`
2. **Web Package Build**: Next.js imports built agent package via `workspace:*`
3. **Output**: Production-ready app in `web/.next/`

## Workspace Dependencies

The `web/package.json` uses:
```json
{
  "dependencies": {
    "@0xvisor/agent": "workspace:*"
  }
}
```

This tells pnpm to:
- Use the local `packages/agent` during development
- Bundle the built agent code in production
- Handle version resolution automatically

## Local Development with Vercel Postgres

To test with Vercel Postgres locally:

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Link your project:
```bash
cd /Users/godson/Desktop/0xvisor
vercel link
```

3. Pull environment variables:
```bash
vercel env pull .env.local
```

4. Run dev server:
```bash
pnpm dev
```

## Troubleshooting

### Build Fails with "Cannot find module @0xvisor/agent"

**Error:**
```
Type error: Cannot find module '@0xvisor/agent' or its corresponding type declarations.
```

**Solution:**
1. **In Vercel Dashboard**, ensure Root Directory is set to `.` (not `web`)
   - This allows the build to access the entire monorepo
   - The agent package must be built before the web package

2. **Verify vercel.json** at project root contains:
```json
{
  "buildCommand": "pnpm install && pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "web/.next",
  "framework": "nextjs"
}
```

3. **Verify root package.json** has correct build order:
```json
{
  "scripts": {
    "build": "pnpm --filter @0xvisor/agent build && pnpm --filter @0xvisor/web build"
  }
}
```

4. **Check pnpm-workspace.yaml** exists at root:
```yaml
packages:
  - 'packages/*'
  - 'web'
```

5. **Ensure next.config.ts** includes transpilePackages:
```typescript
const nextConfig: NextConfig = {
  transpilePackages: ["@0xvisor/agent"],
};
```

6. **Test locally first:**
```bash
cd /Users/godson/Desktop/0xvisor
pnpm build
```
If this succeeds, the build should work on Vercel.

### "workspace:*" not resolved
- Vercel should auto-detect pnpm workspace
- If issues persist, try setting Node version to 18+ in Vercel settings

### Database Connection Issues
- Verify `POSTGRES_URL` is set correctly
- Check that database tables are created
- Review connection pooling settings

### Function Timeout
- Vercel free tier has 10s timeout
- For longer executions, upgrade to Pro

## Production URLs

- **Frontend**: `https://your-project.vercel.app`
- **tRPC API**: `https://your-project.vercel.app/api/trpc/*`

## Monitoring

Set up monitoring in Vercel dashboard:
- **Analytics**: Track page views and performance
- **Logs**: View function execution logs
- **Speed Insights**: Monitor Core Web Vitals

## Notes

- Vercel automatically handles SSL/HTTPS
- Database backups are included with Postgres
- You can set up custom domains in project settings
- Preview deployments are created for each PR
- pnpm workspace is fully supported by Vercel
