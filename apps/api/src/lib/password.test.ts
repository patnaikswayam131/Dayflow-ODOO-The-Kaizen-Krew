import test from 'node:test';
import assert from 'node:assert';
import { validatePassword, generateRandomPassword } from './password.js';

test('Password Policy Validator', async (t) => {
  await t.test('should validate strong passwords conforming to the policy', () => {
    assert.strictEqual(validatePassword('StrongP@ss123'), true);
    assert.strictEqual(validatePassword('Abcdefghij1!'), true);
    assert.strictEqual(validatePassword('ValidP#ssw0rd'), true);
  });

  await t.test('should reject passwords shorter than 10 characters', () => {
    assert.strictEqual(validatePassword('Short1!'), false); // 7 chars
    assert.strictEqual(validatePassword('Abc1!defg'), false);  // 9 chars
  });

  await t.test('should reject passwords missing an uppercase letter', () => {
    assert.strictEqual(validatePassword('lowercase123!'), false);
  });

  await t.test('should reject passwords missing a lowercase letter', () => {
    assert.strictEqual(validatePassword('UPPERCASE123!'), false);
  });

  await t.test('should reject passwords missing a number', () => {
    assert.strictEqual(validatePassword('NoNumbersHere!'), false);
  });

  await t.test('should reject passwords missing a symbol', () => {
    assert.strictEqual(validatePassword('NoSymbols1234'), false);
  });
});

test('Password Generator', async (t) => {
  await t.test('should generate secure passwords that pass the validator', () => {
    for (let i = 0; i < 50; i++) {
      const generated = generateRandomPassword();
      assert.strictEqual(generated.length, 12, 'Generated password must be 12 characters');
      assert.strictEqual(validatePassword(generated), true, `Generated password '${generated}' did not pass validator`);
    }
  });
});
