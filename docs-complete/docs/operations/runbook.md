---
id: runbook
title: Operational Runbook
sidebar_label: Operations Runbook
---

# Operational Runbook

This runbook provides step-by-step procedures for maintaining, monitoring, and troubleshooting the DAO Voting Platform in production. It covers daily operations, incident response, and emergency procedures.

## Daily Operations

### Morning Health Check Routine (9:00 AM)

#### 1. Check Solana Program Status

```bash
# Verify program is deployed and active
solana program show 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj

# Expected output:
# Program Id: 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: <data_address>
# Authority: <authority_address>
# Last Deployed In Slot: <slot_number>
# Data Length: <bytes>
# Balance: <lamports> SOL

# Check for recent transactions
solana program logs 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj --limit 10

# Verify no errors in recent logs
# Look for successful "Program execution" messages
```

#### 2. Verify RPC Endpoint Health

```bash
# Primary RPC health check
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
# Expected: {"jsonrpc":"2.0","result":"ok","id":1}

# Check RPC performance
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' -w "\n%{time_total}s\n"
# Response time should be < 1 second

# Backup RPC health check (if configured)
curl https://solana-mainnet.g.alchemy.com/v2/your-api-key -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

#### 3. Check Frontend Status

```bash
# Production site health check
curl -I https://dao-voting.yourdomain.com
# Expected: HTTP/2 200

# API endpoint check
curl https://dao-voting.yourdomain.com/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# Check latest deployment status
vercel ls dao-voting --token=$VERCEL_TOKEN
# Verify "READY" state for production deployment

# Performance check
curl -w "@curl-format.txt" -o /dev/null -s https://dao-voting.yourdomain.com
# Check: time_total < 2 seconds
```

#### 4. Database Health Check

```sql
-- Connect to Supabase SQL Editor
-- Check connection pool
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
-- Should be < 80 (80% of pool limit)

-- Check database size
SELECT pg_database_size('postgres') / 1024 / 1024 as size_mb;
-- Monitor for unexpected growth

-- Verify backup completion
SELECT backup_id, status, created_at 
FROM pg_backup_history 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
-- Should show successful backup in last 24h

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 -- queries slower than 1 second
ORDER BY mean_exec_time DESC 
LIMIT 5;
```

### Afternoon Metrics Review (2:00 PM)

```javascript
// metrics-check.js
const checkMetrics = async () => {
  // Check proposal activity
  const proposals = await supabase
    .from('proposals_metadata')
    .select('count')
    .gte('created_at', new Date(Date.now() - 24*60*60*1000));
  console.log(`New proposals (24h): ${proposals.count}`);
  
  // Check voting activity
  const votes = await supabase
    .from('voting_history')
    .select('count')
    .gte('created_at', new Date(Date.now() - 24*60*60*1000));
  console.log(`New votes (24h): ${votes.count}`);
  
  // Check unique users
  const users = await supabase
    .from('activity_log')
    .select('wallet_address', { count: 'distinct' })
    .gte('created_at', new Date(Date.now() - 24*60*60*1000));
  console.log(`Active users (24h): ${users.length}`);
  
  // Check error rate
  const errors = await fetch('https://api.sentry.io/organizations/your-org/issues/', {
    headers: { 'Authorization': `Bearer ${SENTRY_TOKEN}` }
  });
  const errorData = await errors.json();
  console.log(`Error events (24h): ${errorData.length}`);
};
```

### Evening Maintenance (6:00 PM)

```bash
# Clean up old logs
find /var/log/dao-voting -name "*.log" -mtime +7 -delete

# Verify disk space
df -h | grep -E "^/dev/"
# Ensure > 20% free space on all volumes

# Check for security updates
npm audit --production
# Address any high/critical vulnerabilities

# Verify SSL certificate expiration
echo | openssl s_client -servername dao-voting.yourdomain.com \
  -connect dao-voting.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
# Ensure > 30 days until expiration
```

## Weekly Maintenance Tasks

### Monday: Performance Review

```bash
# Analyze RPC usage patterns
curl https://api.quicknode.com/analytics/your-endpoint \
  -H "Authorization: Bearer $QUICKNODE_TOKEN" | jq '.weekly_stats'

# Review Vercel Analytics
vercel analytics dao-voting --days=7

# Database query optimization
psql $DATABASE_URL << EOF
VACUUM ANALYZE;
REINDEX DATABASE postgres;
EOF
```

### Wednesday: Security Audit

```bash
# Check for unauthorized program changes
solana program dump 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj current.so
diff current.so deployed.so
# Should show no differences

# Review access logs for anomalies
grep -E "403|401" /var/log/nginx/access.log | tail -100

# Check for suspicious voting patterns
```

```sql
-- Detect potential vote manipulation
WITH vote_patterns AS (
  SELECT 
    wallet_address,
    COUNT(DISTINCT proposal_id) as proposals_voted,
    COUNT(*) as total_votes,
    MIN(created_at) as first_vote,
    MAX(created_at) as last_vote
  FROM voting_history
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY wallet_address
)
SELECT * FROM vote_patterns
WHERE total_votes > 20 -- High activity
  AND EXTRACT(EPOCH FROM (last_vote - first_vote)) < 3600 -- All within 1 hour
ORDER BY total_votes DESC;
```

### Friday: Data Cleanup

```sql
-- Archive old proposals (> 90 days)
INSERT INTO proposals_archive 
SELECT * FROM proposals_metadata 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM proposals_metadata 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Purge test data
DELETE FROM activity_log 
WHERE details->>'environment' = 'test';

-- Compress activity logs
UPDATE activity_log 
SET details = jsonb_strip_nulls(details) 
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Incident Response Procedures

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1** | Critical - System down | < 15 minutes | Program exploit, complete outage |
| **P2** | High - Major functionality impacted | < 1 hour | Voting failures, wallet issues |
| **P3** | Medium - Minor functionality impacted | < 4 hours | Slow performance, UI bugs |
| **P4** | Low - Cosmetic issues | < 24 hours | Text errors, styling issues |

### Issue: Wallet Connection Failures

**Symptoms**: Users report "Cannot connect wallet" errors

**Diagnosis Steps**:

1. **Check RPC Status**:
```bash
# Check Solana network status
curl -s https://status.solana.com/api/v2/status.json | jq '.status.description'

# Test RPC directly
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}'
```

2. **Test with Different Wallets**:
```javascript
// Browser console test
window.solana.isPhantom // Should be true for Phantom
window.backpack // Should exist for Backpack
```

3. **Check Browser Console**:
```javascript
// Look for specific errors
// Common: "RPC Error", "Network Error", "Timeout"
```

**Resolution Steps**:

```typescript
// 1. If RPC issue - Switch to backup RPC
// Update constants.ts
export const RPC_ENDPOINTS = {
  primary: 'https://solana-mainnet.g.alchemy.com/v2/backup-key', // Switch to backup
  secondary: 'https://rpc.helius.xyz/?api-key=backup-key',
};

// 2. If wallet-specific issue
// Clear browser cache and cookies
localStorage.clear();
sessionStorage.clear();

// 3. If app issue - Roll back deployment
vercel rollback dao-voting --token=$VERCEL_TOKEN
```

### Issue: Transaction Failures

**Symptoms**: "Transaction failed" errors when voting or creating proposals

**Common Error Codes**:
- `0x1`: Insufficient SOL for fees
- `0x2`: Invalid instruction data
- `0x3`: Account not found
- `0x4`: Insufficient token balance
- `0x5`: Program error

**Diagnosis**:

```bash
# 1. Get transaction signature from error
SIGNATURE="5KTh3Gh5P8x7mNtg..."

# 2. Check transaction details
solana confirm -v $SIGNATURE

# 3. Get detailed logs
solana transaction-history $SIGNATURE --show-transactions

# 4. Check program logs
solana program logs 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj | grep $SIGNATURE
```

**Resolution by Error Code**:

```javascript
// Handle specific errors
switch(errorCode) {
  case 0x1: // Insufficient funds
    // Notify user to add SOL
    toast.error('Insufficient SOL. Please add at least 0.01 SOL to your wallet.');
    break;
    
  case 0x2: // Invalid instruction
    // Check IDL version mismatch
    const currentIDL = await Program.fetchIdl(PROGRAM_ID);
    if (currentIDL.version !== expectedVersion) {
      // Update IDL
      await updateIDL();
    }
    break;
    
  case 0x3: // Account not found
    // Reinitialize missing account
    await initializeAccount();
    break;
    
  default:
    // Implement retry with exponential backoff
    await retryTransaction(transaction, { maxRetries: 3 });
}
```

### Issue: Database Connection Errors

**Symptoms**: Comments, profiles, or activity logs not loading

**Diagnosis**:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check for blocking queries
SELECT pid, usename, query, state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY query_start;

-- Kill blocking query if needed
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '5 minutes';
```

**Resolution**:

```bash
# 1. Restart connection pool
curl -X POST https://api.supabase.com/v1/projects/$PROJECT_ID/database/restart \
  -H "Authorization: Bearer $SUPABASE_TOKEN"

# 2. Scale up database if at limit
curl -X PATCH https://api.supabase.com/v1/projects/$PROJECT_ID \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -d '{"tier": "pro"}'

# 3. Implement connection pooling in app
```

```typescript
// Add connection pooling
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Issue: High RPC Costs

**Symptoms**: RPC provider bills exceeding budget

**Analysis**:

```javascript
// Identify heavy RPC usage
const analyzeRPCUsage = async () => {
  const logs = await fetchRPCLogs();
  
  const byMethod = logs.reduce((acc, log) => {
    acc[log.method] = (acc[log.method] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Top RPC methods:', Object.entries(byMethod)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10));
    
  const byEndpoint = logs.reduce((acc, log) => {
    acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Top endpoints:', Object.entries(byEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10));
};
```

**Optimization**:

```typescript
// 1. Increase cache duration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // Increase to 10 minutes
      gcTime: 30 * 60 * 1000,    // Keep for 30 minutes
    },
  },
});

// 2. Implement request batching
const batchRequests = async (requests: RpcRequest[]) => {
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  
  return Promise.all(batches.map(batch => 
    connection.sendBatch(batch)
  ));
};

// 3. Use WebSocket subscriptions instead of polling
const subscribeToProgram = () => {
  const subscriptionId = connection.onProgramAccountChange(
    PROGRAM_ID,
    (accountInfo) => {
      // Handle updates
      updateCache(accountInfo);
    },
    'confirmed'
  );
  
  return () => connection.removeProgramAccountChangeListener(subscriptionId);
};
```

## Emergency Procedures

### Program Exploit Detected

**IMMEDIATE ACTIONS** (Within 5 minutes):

```bash
# 1. Alert team via emergency channel
./scripts/alert-team.sh "CRITICAL: Potential exploit detected"

# 2. Document exploit details
echo "Exploit Details:" > exploit-$(date +%s).log
echo "Time: $(date)" >> exploit-*.log
echo "Transaction: $SUSPICIOUS_TX" >> exploit-*.log
echo "Affected Accounts: $ACCOUNTS" >> exploit-*.log

# 3. If upgrade authority exists - Freeze program
solana program set-upgrade-authority $PROGRAM_ID \
  --new-upgrade-authority 11111111111111111111111111111111

# 4. Notify users via all channels
curl -X POST https://api.twitter.com/2/tweets \
  -H "Authorization: Bearer $TWITTER_TOKEN" \
  -d '{"text": "⚠️ Temporary maintenance in progress. Please do not submit transactions."}'

# 5. Disable frontend interactions
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE=true --production
```

**RECOVERY STEPS**:

```typescript
// 1. Analyze the exploit
const analyzeExploit = async () => {
  const exploitTx = await connection.getTransaction(SUSPICIOUS_TX);
  const affectedAccounts = exploitTx.transaction.message.accountKeys;
  const instructionData = exploitTx.transaction.message.instructions;
  
  // Log all details
  console.log('Exploit analysis:', {
    signature: SUSPICIOUS_TX,
    accounts: affectedAccounts,
    instructions: instructionData,
    logs: exploitTx.meta.logMessages,
  });
};

// 2. Prepare patched version
// Deploy to devnet first for testing
anchor deploy --provider.cluster devnet

// 3. Coordinate deployment timing
// Announce maintenance window
// Deploy new version
// Update frontend to new program ID

// 4. Post-incident review
// Document lessons learned
// Update security procedures
```

### Frontend Compromise

**Detection**:
```bash
# Check for unauthorized changes
git diff HEAD origin/main

# Verify deployment integrity
vercel inspect dao-voting --token=$VERCEL_TOKEN

# Check for suspicious scripts
grep -r "eval\|Function(\|setTimeout.*http\|fetch.*credentials" ./
```

**Response**:

```bash
# 1. Immediate rollback
vercel rollback dao-voting --token=$VERCEL_TOKEN

# 2. Revoke all API keys
# Update in Vercel dashboard
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY --production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEW_KEY --production

# 3. Audit recent commits
git log --since="1 week ago" --pretty=format:"%h %an %s" --stat

# 4. Reset secrets
openssl rand -base64 32 > new-secret.txt
vercel env rm NEXTAUTH_SECRET --production
vercel env add NEXTAUTH_SECRET=$(cat new-secret.txt) --production

# 5. Deploy clean version
git checkout main
git pull origin main --verify-signatures
vercel --prod --force
```

### Database Breach

**Detection**:
```sql
-- Check for suspicious activity
SELECT * FROM activity_log
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND (
    action_type = 'bulk_export'
    OR action_type = 'admin_access'
    OR details->>'query' LIKE '%SELECT%*%FROM%'
  )
ORDER BY created_at DESC;
```

**Response**:

```sql
-- 1. Enable read-only mode immediately
ALTER DATABASE postgres SET default_transaction_read_only = on;

-- 2. Capture audit logs
COPY (
  SELECT * FROM activity_log 
  WHERE created_at > NOW() - INTERVAL '24 hours'
) TO '/tmp/audit-backup.csv' CSV HEADER;

-- 3. Reset all user sessions
TRUNCATE TABLE auth.sessions;

-- 4. Review and update RLS policies
DROP POLICY IF EXISTS "old_policy" ON table_name;
CREATE POLICY "new_secure_policy" ON table_name
  USING (auth.uid() = user_id AND verified = true);

-- 5. Notify affected users
INSERT INTO notifications (user_id, message, type)
SELECT DISTINCT wallet_address, 
  'Security update: Please re-authenticate your account',
  'security'
FROM profiles;
```

## Monitoring Setup

### Key Metrics to Track

```typescript
// monitoring-config.ts
export const METRICS = {
  // Business Metrics
  totalProposals: 'SELECT COUNT(*) FROM proposals',
  activeProposals: 'SELECT COUNT(*) FROM proposals WHERE status = "active"',
  participationRate: `
    SELECT AVG(votes_cast::float / eligible_voters) as rate
    FROM proposal_stats
  `,
  
  // Performance Metrics
  avgResponseTime: 'p95 response time < 2s',
  errorRate: 'error rate < 1%',
  uptime: 'uptime > 99.9%',
  
  // Security Metrics
  failedTransactions: 'failed tx < 5%',
  unauthorizedAccess: '401/403 errors < 0.1%',
  suspiciousActivity: 'anomaly score < 10',
};
```

### Alert Configuration

```yaml
# alerts.yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    notify:
      - email: ops@lazer.com
      - slack: #alerts
      - pagerduty: dao-voting
      
  - name: low_participation
    condition: participation_rate < 5%
    duration: 24h
    severity: warning
    notify:
      - email: team@lazer.com
      
  - name: rpc_degradation
    condition: rpc_response_time > 2s
    duration: 10m
    severity: high
    action: switch_to_backup_rpc
```

### Dashboard Setup

```javascript
// Custom monitoring dashboard
const DaoMonitoringDashboard = () => {
  return (
    <Dashboard>
      <Row>
        <Panel title="Proposal Activity">
          <LineChart data={proposalTrend} />
        </Panel>
        <Panel title="Voting Participation">
          <GaugeChart value={participationRate} />
        </Panel>
      </Row>
      <Row>
        <Panel title="System Health">
          <StatusGrid services={[
            { name: 'Solana Program', status: programStatus },
            { name: 'Frontend', status: frontendStatus },
            { name: 'Database', status: dbStatus },
            { name: 'RPC', status: rpcStatus },
          ]} />
        </Panel>
        <Panel title="Recent Errors">
          <ErrorLog limit={10} />
        </Panel>
      </Row>
    </Dashboard>
  );
};
```

## Command Reference

### Frequently Used Commands

```bash
# Solana Program Commands
solana program show <PROGRAM_ID>                    # Show program info
solana program dump <PROGRAM_ID> output.so         # Download program
solana program logs <PROGRAM_ID> --limit 50        # View recent logs
solana program close <PROGRAM_ID>                  # Close program (recovers rent)

# Transaction Investigation
solana confirm -v <SIGNATURE>                      # Confirm transaction
solana transaction-history <ADDRESS> --limit 10    # View address history
solana balance <ADDRESS>                           # Check SOL balance

# Database Commands
psql $DATABASE_URL -c "SELECT * FROM table"        # Query database
pg_dump $DATABASE_URL > backup.sql                 # Backup database
psql $DATABASE_URL < restore.sql                   # Restore database

# Deployment Commands
vercel --prod                                      # Deploy to production
vercel rollback                                    # Rollback deployment
vercel env pull                                    # Pull environment variables
vercel logs dao-voting --follow                    # Stream logs

# Monitoring Commands
curl -I https://dao-voting.com                     # Check site status
npm audit --production                             # Check vulnerabilities
lighthouse https://dao-voting.com --view           # Performance audit
```

## Contact Information

### Escalation Matrix

| Role | Name | Contact | When to Contact |
|------|------|---------|-----------------|
| On-Call Engineer | Rotation | See PagerDuty | First response for all incidents |
| Tech Lead | John Doe | john@lazer.com | P1/P2 incidents |
| Infrastructure | Jane Smith | jane@lazer.com | RPC/Database issues |
| Security | Bob Wilson | bob@lazer.com | Exploits/Breaches |
| Product Manager | Alice Brown | alice@lazer.com | User-facing issues |

### External Support

| Service | Contact | Account # | Use Case |
|---------|---------|-----------|----------|
| QuickNode RPC | support@quicknode.com | QN-12345 | RPC issues |
| Vercel | Via Dashboard | team_xyz | Deployment issues |
| Supabase | Via Dashboard | org_abc | Database issues |
| Helius | support@helius.xyz | HL-67890 | Backup RPC |

### Emergency Contacts

- **Solana Security**: security@solana.com
- **Incident Hotline**: +1-555-0123 (24/7)
- **Legal Team**: legal@lazer.com
- **PR/Communications**: pr@lazer.com
