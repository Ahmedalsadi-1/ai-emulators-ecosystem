#!/usr/bin/env node
/**
 * Build Verification Script
 *
 * Verifies that all required build artifacts exist after running `npm run build`.
 * This ensures the build process completed successfully before deployment.
 *
 * Usage: node scripts/verify-build.js
 * Exit codes:
 *   0 - All artifacts present
 *   1 - Some artifacts missing
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_DIRS = [
  {
    path: 'bytebot/packages/shared/dist',
    description: 'Shared package compiled output'
  },
  {
    path: 'bytebot/packages/bytebot-ui/.next',
    description: 'Next.js production build'
  },
  {
    path: 'bytebot/packages/bytebot-agent/dist',
    description: 'Bytebot Agent NestJS build'
  },
  {
    path: 'bytebot/packages/bytebotd/dist',
    description: 'Bytebotd daemon build'
  }
];

function verifyBuild() {
  console.log('🔍 Verifying build artifacts...\n');

  let hasErrors = false;
  let foundCount = 0;

  for (const dir of REQUIRED_DIRS) {
    const fullPath = path.join(__dirname, '..', dir.path);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing: ${dir.path}`);
      console.error(`   Description: ${dir.description}`);
      hasErrors = true;
    } else {
      // Check if directory is not empty
      const contents = fs.readdirSync(fullPath);
      if (contents.length === 0) {
        console.error(`⚠️  Empty: ${dir.path} (directory exists but has no files)`);
        hasErrors = true;
      } else {
        console.log(`✅ Found: ${dir.path}`);
        console.log(`   ${dir.description}`);
        foundCount++;
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('⚠️  BUILD VERIFICATION FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error('Some build artifacts are missing or empty.');
    console.error('Run the following command to build all packages:');
    console.error('');
    console.error('  cd bytebot/packages/shared && npm run build');
    console.error('  cd ../bytebot-ui && npm run build');
    console.error('  cd ../bytebot-agent && npm run build');
    console.error('  cd ../bytebotd && npm run build');
    console.error('');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ BUILD VERIFICATION PASSED (${foundCount}/${REQUIRED_DIRS.length} artifacts)`);
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(0);
}

// Run verification
verifyBuild();
