import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from 'crypto';
import type { AuthTokenPayload } from './auth.types';

const UTF8 = 'utf8';

function base64UrlEncode(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input, UTF8) : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

export function signJwt(payload: AuthTokenPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${headerEncoded}.${payloadEncoded}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest();
  const signatureEncoded = base64UrlEncode(signature);
  return `${unsigned}.${signatureEncoded}`;
}

export function verifyJwt(token: string, secret: string): AuthTokenPayload {
  const [headerEncoded, payloadEncoded, signatureEncoded] = token.split('.');
  if (!headerEncoded || !payloadEncoded || !signatureEncoded) {
    throw new Error('Invalid token format');
  }

  const unsigned = `${headerEncoded}.${payloadEncoded}`;
  const expectedSignature = createHmac('sha256', secret).update(unsigned).digest();
  const actualSignature = base64UrlDecode(signatureEncoded);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString(UTF8)) as AuthTokenPayload;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid token payload');
  }

  return payload;
}

export function hashPassword(password: string, salt?: string): string {
  const resolvedSalt = salt || randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, resolvedSalt, 100000, 64, 'sha512').toString('hex');
  return `${resolvedSalt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }
  const comparison = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const comparisonBuffer = Buffer.from(comparison, 'hex');
  if (hashBuffer.length !== comparisonBuffer.length) {
    return false;
  }
  return timingSafeEqual(hashBuffer, comparisonBuffer);
}

export function generateTokenId(): string {
  return randomBytes(16).toString('hex');
}
