// Password helpers for password-protected private pastes.
// Passwords are stored as PBKDF2 hashes. Viewers who unlock a paste get an
// HMAC-signed cookie bound to the current hash, so changing the password
// invalidates every existing unlock.

import { isAuthenticated, parseCookies } from './auth';

// 100000 is the maximum PBKDF2 iteration count supported by Workers WebCrypto
const HASH_ITERATIONS = 100000;

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: HASH_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

// Returns "saltHex:hashHex"
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derive(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const hash = await derive(password, fromHex(saltHex));
  return safeEqual(toHex(hash), hashHex);
}

export function unlockCookieName(id: string): string {
  return `pbnj_unlock_${id}`;
}

export async function unlockToken(id: string, passwordHash: string, authKey: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}:${passwordHash}`));
  return toHex(new Uint8Array(signature));
}

// Owners always have access. Everyone else needs a valid unlock cookie.
export async function hasPasswordAccess(
  request: Request,
  db: any,
  authKey: string,
  id: string,
  passwordHash: string
): Promise<boolean> {
  if (await isAuthenticated(request, db, authKey)) {
    return true;
  }

  const provided = parseCookies(request)[unlockCookieName(id)];
  if (!provided) {
    return false;
  }

  return safeEqual(provided, await unlockToken(id, passwordHash, authKey));
}
