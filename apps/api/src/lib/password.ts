import crypto from 'crypto';
import { passwordSchema } from '@dayflow/shared';

/**
 * Validates a password against the server-side strength requirements.
 * Minimum 10 characters, at least one uppercase, one lowercase, one number, one symbol.
 */
export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

/**
 * Generates a cryptographically secure random password that satisfies
 * the password policy (uppercase, lowercase, number, symbol, min 10 chars).
 */
export function generateRandomPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure at least one character from each required set is present
  const passwordChars: string[] = [
    lowercase[crypto.randomInt(lowercase.length)]!,
    uppercase[crypto.randomInt(uppercase.length)]!,
    numbers[crypto.randomInt(numbers.length)]!,
    symbols[crypto.randomInt(symbols.length)]!,
  ];

  // Fill up the rest to 12 characters (well above the 10 minimum requirement)
  for (let i = 0; i < 8; i++) {
    passwordChars.push(allChars[crypto.randomInt(allChars.length)]!);
  }

  // Cryptographically shuffle the array of characters
  // Using Durstenfeld shuffle with crypto.randomInt
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    const temp = passwordChars[i]!;
    passwordChars[i] = passwordChars[j]!;
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}
