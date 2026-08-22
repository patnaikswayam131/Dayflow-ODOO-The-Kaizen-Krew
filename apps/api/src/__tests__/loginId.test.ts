import { describe, it, expect } from 'vitest';
import { extractNameChars } from '../services/loginId.service.js';

/**
 * Login ID Generator Unit Tests (FR-3).
 *
 * The `generateLoginId` function itself requires a real DB transaction
 * (for the atomic sequence increment), so full integration tests for it
 * need a running Postgres instance. Those are covered in integration tests.
 *
 * These tests cover the pure-function logic:
 * - Name character extraction (extractNameChars)
 * - Login ID format validation
 * - Edge cases for short/special names
 */

describe('extractNameChars', () => {
  it('extracts first 2 characters and uppercases them', () => {
    expect(extractNameChars('John', 2)).toBe('JO');
    expect(extractNameChars('Doe', 2)).toBe('DO');
  });

  it('handles names with exactly 2 characters', () => {
    expect(extractNameChars('Jo', 2)).toBe('JO');
    expect(extractNameChars('Li', 2)).toBe('LI');
  });

  it('pads with X when name is shorter than requested count', () => {
    expect(extractNameChars('A', 2)).toBe('AX');
  });

  it('pads with XX when name is empty after cleaning', () => {
    expect(extractNameChars('', 2)).toBe('XX');
  });

  it('strips non-alpha characters before extraction', () => {
    expect(extractNameChars("O'Brien", 2)).toBe('OB');
    expect(extractNameChars('Anne-Marie', 2)).toBe('AN');
    expect(extractNameChars('Dr.Smith', 2)).toBe('DR');
  });

  it('handles names with numbers', () => {
    expect(extractNameChars('J0hn', 2)).toBe('JH');
  });

  it('handles unicode names by stripping non-ASCII alpha', () => {
    // Characters like ñ, ü, é get stripped by [^A-Za-z]
    expect(extractNameChars('José', 2)).toBe('JO');
    expect(extractNameChars('Müller', 2)).toBe('ML');
  });

  it('is case-insensitive (always uppercases)', () => {
    expect(extractNameChars('john', 2)).toBe('JO');
    expect(extractNameChars('JOHN', 2)).toBe('JO');
    expect(extractNameChars('jOhN', 2)).toBe('JO');
  });

  it('handles longer extraction counts', () => {
    expect(extractNameChars('John', 4)).toBe('JOHN');
    expect(extractNameChars('Al', 4)).toBe('ALXX');
  });
});

describe('Login ID Format', () => {
  it('produces the correct format: [prefix][2+2 name chars][year][4-digit seq]', () => {
    // Simulate what generateLoginId would produce
    const prefix = 'OI';
    const nameChars = extractNameChars('John', 2) + extractNameChars('Doe', 2);
    const year = 2022;
    const seq = 1;

    const loginId = `${prefix}${nameChars}${year}${String(seq).padStart(4, '0')}`;
    expect(loginId).toBe('OIJODO20220001');
  });

  it('handles the SRS example exactly', () => {
    // SRS FR-3 example: OIJODO20220001
    const prefix = 'OI';
    const nameChars = extractNameChars('John', 2) + extractNameChars('Doe', 2);
    const year = 2022;
    const seq = 1;

    const loginId = `${prefix}${nameChars}${year}${String(seq).padStart(4, '0')}`;
    expect(loginId).toBe('OIJODO20220001');
  });

  it('handles 4-char prefix', () => {
    const prefix = 'ABCD';
    const nameChars = extractNameChars('Jane', 2) + extractNameChars('Smith', 2);
    const year = 2026;
    const seq = 42;

    const loginId = `${prefix}${nameChars}${year}${String(seq).padStart(4, '0')}`;
    expect(loginId).toBe('ABCDJASM20260042');
  });

  it('handles large sequence numbers', () => {
    const prefix = 'OI';
    const nameChars = extractNameChars('Test', 2) + extractNameChars('User', 2);
    const year = 2026;
    const seq = 9999;

    const loginId = `${prefix}${nameChars}${year}${String(seq).padStart(4, '0')}`;
    expect(loginId).toBe('OITEUS20269999');
  });

  it('handles sequence numbers above 9999 (5 digits)', () => {
    const prefix = 'OI';
    const nameChars = extractNameChars('Test', 2) + extractNameChars('User', 2);
    const year = 2026;
    const seq = 10000;

    // padStart(4, '0') won't truncate — 10000 stays as '10000'
    const loginId = `${prefix}${nameChars}${year}${String(seq).padStart(4, '0')}`;
    expect(loginId).toBe('OITEUS202610000');
  });
});

/**
 * NOTE: Concurrent sequence test (two employees "simultaneously" getting
 * different sequence numbers) requires a real Postgres database and is
 * implemented as an integration test. The test below documents the expected
 * behavior for reference.
 *
 * Integration test (requires DB):
 * ```ts
 * it('assigns different sequence numbers under concurrent creation', async () => {
 *   const [id1, id2] = await Promise.all([
 *     prisma.$transaction(tx => generateLoginId(tx, companyId, 'OI', 'John', 'Doe', 2026)),
 *     prisma.$transaction(tx => generateLoginId(tx, companyId, 'OI', 'Jane', 'Doe', 2026)),
 *   ]);
 *   // Same company+year → different sequence numbers
 *   const seq1 = id1.slice(-4);
 *   const seq2 = id2.slice(-4);
 *   expect(seq1).not.toBe(seq2);
 * });
 * ```
 */
