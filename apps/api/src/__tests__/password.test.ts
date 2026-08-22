import { describe, it, expect } from 'vitest';
import {
  generateSecurePassword,
  hashPassword,
  comparePassword,
  validatePasswordPolicy,
} from '../services/password.service.js';

describe('Password Policy Validator', () => {
  it('rejects passwords shorter than 10 characters', () => {
    const errors = validatePasswordPolicy('Ab1!short');
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.includes('10 characters'))).toBe(true);
  });

  it('rejects passwords without uppercase letters', () => {
    const errors = validatePasswordPolicy('abcdefgh1!2');
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.includes('uppercase'))).toBe(true);
  });

  it('rejects passwords without lowercase letters', () => {
    const errors = validatePasswordPolicy('ABCDEFGH1!2');
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.includes('lowercase'))).toBe(true);
  });

  it('rejects passwords without numbers', () => {
    const errors = validatePasswordPolicy('Abcdefghij!');
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.includes('number'))).toBe(true);
  });

  it('rejects passwords without symbols', () => {
    const errors = validatePasswordPolicy('Abcdefghij1');
    expect(errors).not.toBeNull();
    expect(errors!.some((e) => e.includes('symbol'))).toBe(true);
  });

  it('accepts a password that meets all requirements', () => {
    const errors = validatePasswordPolicy('Abcdefgh1!');
    expect(errors).toBeNull();
  });

  it('accepts a longer valid password', () => {
    const errors = validatePasswordPolicy('MyStr0ng!Pass#2024');
    expect(errors).toBeNull();
  });

  it('returns multiple errors when multiple rules are violated', () => {
    const errors = validatePasswordPolicy('short');
    expect(errors).not.toBeNull();
    // Should fail on length, uppercase, number, and symbol
    expect(errors!.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Secure Password Generator', () => {
  it('generates a password that passes the policy', () => {
    const password = generateSecurePassword();
    const errors = validatePasswordPolicy(password);
    expect(errors).toBeNull();
  });

  it('generates passwords of the requested length', () => {
    const password = generateSecurePassword(16);
    expect(password.length).toBe(16);
  });

  it('throws if requested length is below 10', () => {
    expect(() => generateSecurePassword(5)).toThrow('at least 10');
  });

  it('consistently passes policy across 100 iterations', () => {
    for (let i = 0; i < 100; i++) {
      const password = generateSecurePassword();
      const errors = validatePasswordPolicy(password);
      expect(errors).toBeNull();
    }
  });

  it('generates unique passwords (no duplicates in 100 runs)', () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 100; i++) {
      passwords.add(generateSecurePassword());
    }
    // All 100 should be unique (cryptographic randomness)
    expect(passwords.size).toBe(100);
  });

  it('default length is 14 characters', () => {
    const password = generateSecurePassword();
    expect(password.length).toBe(14);
  });
});

describe('Password Hashing', () => {
  it('hashes and compares correctly (round trip)', async () => {
    const plain = 'TestPassword1!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

    const isMatch = await comparePassword(plain, hash);
    expect(isMatch).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('CorrectPassword1!');
    const isMatch = await comparePassword('WrongPassword1!', hash);
    expect(isMatch).toBe(false);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const plain = 'SamePassword1!';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2); // Different salts
  });
});
