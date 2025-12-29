#!/usr/bin/env node
const { pbkdf2Sync, randomBytes } = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
console.log(`${salt}:${hash}`);
