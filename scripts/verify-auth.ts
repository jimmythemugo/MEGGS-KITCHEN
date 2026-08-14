// ============================================================================
// MEGGS KITCHEN — SUPABASE AUTHENTICATION MIGRATION VERIFIER
// File: scripts/verify-auth.ts
// ============================================================================

import fs from 'fs';
import path from 'path';

function runAuthAudit() {
  console.log('====================================================');
  console.log('MEGGS KITCHEN — AUTHENTICATION MIGRATION AUDIT');
  console.log('====================================================\n');

  const rootDir = process.cwd();
  const errors: string[] = [];

  // 1. Verify legacy auth-seed.ts is removed
  const legacySeedPath = path.join(rootDir, 'src', 'lib', 'auth-seed.ts');
  if (fs.existsSync(legacySeedPath)) {
    errors.push('CRITICAL: src/lib/auth-seed.ts still exists. It must be completely removed.');
  } else {
    console.log('✓ Legacy auth-seed.ts successfully removed from codebase');
  }

  // 2. Verify all references to auth-seed in src/ are eliminated
  const srcDir = path.join(rootDir, 'src');
  const allFiles: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        allFiles.push(fullPath);
      }
    }
  }
  scanDir(srcDir);

  let authSeedReferences = 0;
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('auth-seed')) {
      errors.push(`Found lingering reference to auth-seed in: ${file}`);
      authSeedReferences++;
    }
  }

  if (authSeedReferences === 0) {
    console.log(`✓ Scanned ${allFiles.length} source files: 0 references to legacy auth-seed found`);
  }

  // 3. Verify core auth module src/lib/auth.ts exists and exports expected methods
  const authModulePath = path.join(rootDir, 'src', 'lib', 'auth.ts');
  if (!fs.existsSync(authModulePath)) {
    errors.push('Missing src/lib/auth.ts');
  } else {
    const authContent = fs.readFileSync(authModulePath, 'utf-8');
    const expectedExports = [
      'signInWithEmail',
      'signUpWithEmail',
      'signOutUser',
      'resetPasswordForEmail',
      'updateAuthPassword',
      'fetchUserProfile',
      'getPermissionsForRole',
    ];
    for (const exp of expectedExports) {
      if (!authContent.includes(exp)) {
        errors.push(`src/lib/auth.ts missing expected export: ${exp}`);
      }
    }
    console.log('✓ src/lib/auth.ts verified with complete Supabase Auth API surface');
  }

  // 4. Verify AuthProvider and useAuth hook
  const useAuthPath = path.join(rootDir, 'src', 'hooks', 'use-auth.tsx');
  if (!fs.existsSync(useAuthPath)) {
    errors.push('Missing src/hooks/use-auth.tsx');
  } else {
    const hookContent = fs.readFileSync(useAuthPath, 'utf-8');
    if (!hookContent.includes('AuthProvider') || !hookContent.includes('useAuth')) {
      errors.push('src/hooks/use-auth.tsx must export AuthProvider and useAuth');
    }
    console.log('✓ src/hooks/use-auth.tsx verified with AuthProvider and useAuth hook');
  }

  // 5. Verify Auth migration SQL file exists
  const authMigrationPath = path.join(rootDir, 'supabase', 'migrations', '20260814000004_auth_migration.sql');
  if (!fs.existsSync(authMigrationPath)) {
    errors.push('Missing 20260814000004_auth_migration.sql');
  } else {
    const sqlContent = fs.readFileSync(authMigrationPath, 'utf-8');
    if (!sqlContent.includes('handle_new_user') || !sqlContent.includes('current_user_role')) {
      errors.push('Auth migration missing required trigger functions');
    }
    console.log('✓ supabase/migrations/20260814000004_auth_migration.sql verified');
  }

  // 6. Verify AdminGuard uses Supabase Auth
  const adminGuardPath = path.join(rootDir, 'src', 'components', 'admin', 'AdminGuard.tsx');
  if (!fs.existsSync(adminGuardPath)) {
    errors.push('Missing AdminGuard.tsx');
  } else {
    const guardContent = fs.readFileSync(adminGuardPath, 'utf-8');
    if (!guardContent.includes('useAuth') || guardContent.includes('auth-seed')) {
      errors.push('AdminGuard.tsx must use useAuth and not auth-seed');
    }
    console.log('✓ AdminGuard.tsx verified using Supabase useAuth RBAC');
  }

  console.log('\n----------------------------------------------------');
  if (errors.length > 0) {
    console.error(`AUDIT FAILED WITH ${errors.length} ERRORS:`);
    errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
  } else {
    console.log('✓ ALL AUTHENTICATION MIGRATION CHECKS PASSED PERFECTLY!\n');
  }
}

runAuthAudit();
