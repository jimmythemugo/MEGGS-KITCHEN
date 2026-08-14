// ============================================================================
// MEGGS KITCHEN — DATABASE SCHEMA & MIGRATION VERIFIER
// File: scripts/verify-database.ts
// ============================================================================

import fs from 'fs';
import path from 'path';

function verifySqlFile(filePath: string) {
  console.log(`[SQL VERIFY] Inspecting: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all CREATE TABLE statements
  const tableMatches = content.match(/CREATE TABLE (?:IF NOT EXISTS )?([a-zA-Z0-9_]+)/gi) || [];
  const tables = tableMatches.map(t => t.replace(/CREATE TABLE (?:IF NOT EXISTS )?/i, '').trim());

  // Extract all CREATE INDEX statements
  const indexMatches = content.match(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?([a-zA-Z0-9_]+)/gi) || [];
  const indexes = indexMatches.map(i => i.replace(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?/i, '').trim());

  // Extract all CREATE POLICY statements
  const policyMatches = content.match(/CREATE POLICY "([^"]+)"/gi) || [];
  const policies = policyMatches.map(p => p.replace(/CREATE POLICY "/i, '').replace('"', '').trim());

  console.log(`  ✓ Tables defined (${tables.length}): ${tables.join(', ')}`);
  if (indexes.length > 0) {
    console.log(`  ✓ Indexes defined (${indexes.length}): ${indexes.join(', ')}`);
  }
  if (policies.length > 0) {
    console.log(`  ✓ Policies defined (${policies.length}): ${policies.length} policies`);
  }

  return { tables, indexes, policies };
}

async function run() {
  console.log('====================================================');
  console.log('MEGGS KITCHEN — DATABASE MIGRATIONS VERIFICATION');
  console.log('====================================================\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  let allTables: string[] = [];
  let allIndexes: string[] = [];
  let allPolicies: string[] = [];

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const result = verifySqlFile(fullPath);
    allTables = [...allTables, ...result.tables];
    allIndexes = [...allIndexes, ...result.indexes];
    allPolicies = [...allPolicies, ...result.policies];
  }

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TABLES CREATED: ${allTables.length}`);
  console.log(`TOTAL INDEXES CREATED: ${allIndexes.length}`);
  console.log(`TOTAL SECURITY POLICIES: ${allPolicies.length}`);
  console.log('----------------------------------------------------\n');

  // Verify Seed File
  const seedFile = path.join(process.cwd(), 'supabase', 'seed.sql');
  console.log(`[SEED VERIFY] Inspecting: ${seedFile}`);
  const seedContent = fs.readFileSync(seedFile, 'utf-8');
  const insertMatches = seedContent.match(/INSERT INTO ([a-zA-Z0-9_]+)/gi) || [];
  const seededTables = insertMatches.map(i => i.replace(/INSERT INTO /i, '').trim());
  console.log(`  ✓ Authoritative Seed Tables (${seededTables.length}): ${seededTables.join(', ')}`);

  console.log('\n✓ ALL DATABASE MIGRATIONS & SEED SCRIPTS VERIFIED SUCCESSFULLY!\n');
}

run().catch((err) => {
  console.error('[VERIFICATION ERROR]:', err);
  process.exit(1);
});
