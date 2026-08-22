import test from 'node:test';
import assert from 'node:assert';
import { prisma } from './prisma.js';
import { generateLoginIdAndEmpCode, normalizeNamePart } from './loginIdGenerator.js';

test('Name Normalization', async (t) => {
  await t.test('should uppercase and take first 2 letters of first/last name', () => {
    assert.strictEqual(normalizeNamePart('John'), 'JO');
    assert.strictEqual(normalizeNamePart('doe'), 'DO');
  });

  await t.test('should handle names with spaces and special characters', () => {
    assert.strictEqual(normalizeNamePart('o\'neill'), 'ON');
    assert.strictEqual(normalizeNamePart('Jean-Pierre'), 'JE');
    assert.strictEqual(normalizeNamePart('Mary Ann'), 'MA');
  });

  await t.test('should pad short names with X', () => {
    assert.strictEqual(normalizeNamePart('a'), 'AX');
    assert.strictEqual(normalizeNamePart(''), 'XX');
  });
});

test('Login ID Sequence Generator & Concurrency', async (t) => {
  let tempCompanyId: string;

  // Set up: Create a temporary company to run test against
  const company = await prisma.companies.create({
    data: {
      name: 'Test Concurrency Corp',
      login_prefix: 'TCC',
    },
  });
  tempCompanyId = company.id;

  await t.test('should generate initial sequential sequence starting at 1', async () => {
    const result = await prisma.$transaction(async (tx) => {
      return await generateLoginIdAndEmpCode(tx, tempCompanyId, 'John', 'Doe', 2026);
    });

    assert.strictEqual(result.sequence, 1);
    assert.strictEqual(result.loginId, 'TCCJODO20260001');
    assert.strictEqual(result.empCode, 'EMP-2026-0001');
  });

  await t.test('should generate incremented sequences sequentially', async () => {
    const result = await prisma.$transaction(async (tx) => {
      return await generateLoginIdAndEmpCode(tx, tempCompanyId, 'Alice', 'Smith', 2026);
    });

    assert.strictEqual(result.sequence, 2);
    assert.strictEqual(result.loginId, 'TCCALSM20260002');
    assert.strictEqual(result.empCode, 'EMP-2026-0002');
  });

  await t.test('should handle concurrent login ID generation safely without race conditions', async () => {
    // Perform 2 simultaneous employee registrations
    const promises = [
      prisma.$transaction(async (tx) => {
        return await generateLoginIdAndEmpCode(tx, tempCompanyId, 'ConcurrentA', 'UserA', 2026);
      }),
      prisma.$transaction(async (tx) => {
        return await generateLoginIdAndEmpCode(tx, tempCompanyId, 'ConcurrentB', 'UserB', 2026);
      })
    ];

    const results = await Promise.all(promises);

    // Verify sequences are distinct and sequential (3 and 4)
    const seqs = results.map(r => r.sequence).sort((a, b) => a - b);
    assert.deepStrictEqual(seqs, [3, 4], 'Concurrent sequences must be 3 and 4');

    const firstResult = results.find(r => r.sequence === 3);
    const secondResult = results.find(r => r.sequence === 4);

    assert.ok(firstResult);
    assert.ok(secondResult);

    assert.match(firstResult.loginId, /^TCC[A-Z0-9]{4}20260003$/);
    assert.match(secondResult.loginId, /^TCC[A-Z0-9]{4}20260004$/);
  });

  // Clean up: delete the temporary company
  await prisma.companies.delete({
    where: { id: tempCompanyId },
  });
});
