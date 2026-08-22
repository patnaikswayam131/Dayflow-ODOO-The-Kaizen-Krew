import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { passwordSchema } from '@dayflow/shared';

// ─── Configuration ───
const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD_LENGTH = 14;

// Character pools for password generation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

/**
 * Generate a cryptographically random password that meets the policy (FR-4, Security Checklist #9).
 *
 * - Uses `crypto.randomBytes` for true randomness
 * - Guarantees at least one char from each required class
 * - Validates against passwordSchema before returning
 * - NEVER logged or stored in plaintext anywhere
 */
export function generateSecurePassword(length: number = DEFAULT_PASSWORD_LENGTH): string {
  if (length < 10) {
    throw new Error('Password length must be at least 10 to meet policy');
  }

  // Guarantee at least one character from each required class
  const required = [
    pickRandom(UPPERCASE),
    pickRandom(LOWERCASE),
    pickRandom(DIGITS),
    pickRandom(SYMBOLS),
  ];

  // Fill the remaining length with random chars from the full pool
  const remaining: string[] = [];
  for (let i = 0; i < length - required.length; i++) {
    remaining.push(pickRandom(ALL_CHARS));
  }

  // Combine and shuffle to avoid predictable positions
  const chars = [...required, ...remaining];
  shuffleArray(chars);

  const password = chars.join('');

  // Belt-and-suspenders: validate against the policy schema
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    // This should never happen, but if it does, retry once
    return generateSecurePassword(length);
  }

  return password;
}

/**
 * Hash a plaintext password with bcrypt (Security Checklist #9).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * bcrypt.compare is timing-safe by design.
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Validate a password against the policy (SRS §6.1, Security Checklist #19).
 * Returns null if valid, or an array of error messages if invalid.
 */
export function validatePasswordPolicy(password: string): string[] | null {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return null;
  }
  return result.error.issues.map((issue) => issue.message);
}

// ─── Internal Helpers ───

function pickRandom(pool: string): string {
  const index = crypto.randomInt(pool.length);
  return pool[index]!;
}

function shuffleArray(arr: string[]): void {
  // Fisher-Yates shuffle with cryptographic randomness
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}
