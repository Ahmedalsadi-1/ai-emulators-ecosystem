#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures all required build artifacts exist before packaging
 */

const path = require('path');
const fs = require('fs');

const requiredPaths = [
  {
    path: 'bytebot/packages/shared/dist/index.js',
    description: 'Shared package output'
  },
  {
    path: 'bytebot/packages/bytebot-agent/dist/main.js',
    description: 'Bytebot Agent output'
  },
  {
    path: 'bytebot/packages/bytebotd/dist/main.js',
    description: 'Bytebot Desktop output'
  },
  {
    path: 'bytebot/packages/bytebot-ui/.next/server/app/index.html',
    description: 'Next.js static export output'
  }
];

function verifyBuilds() {
  const rootDir = path.join(__dirname, '..');
  let hasErrors = false;

  console.log('🔍 Verifying build artifacts...\n');

  for (const { path: relPath, description } of requiredPaths) {
    const fullPath = path.join(rootDir, relPath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing: ${relPath}`);
      console.error(`   Description: ${description}`);
      hasErrors = true;
    } else {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✓ Found: ${relPath} (${sizeKB} KB)`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('⚠️  Build verification failed!');
    console.error('\nTo build missing artifacts, run:');
    console.error('  npm run build:shared       # Build shared package');
    console.error('  npm run build:backend      # Build bytebot-agent and bytebotd');
    console.error('  npm run build:frontend     # Build bytebot-ui');
    console.error('  npm run build              # Build all (includes verification)\n');
    process.exit(1);
  }

  console.log('✅ All build artifacts verified!\n');
  return true;
}

// Run verification
verifyBuilds();
