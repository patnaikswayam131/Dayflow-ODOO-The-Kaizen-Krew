import type { Prisma } from '@prisma/client';
import { BadRequestError } from './errors.js';

/**
 * Normalizes name inputs by removing non-alphabetic characters,
 * converting to uppercase, and padding with 'X' if shorter than 2 chars.
 */
export function normalizeNamePart(name: string): string {
  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.length === 0) return 'XX';
  if (clean.length === 1) return `${clean}X`;
  return clean.slice(0, 2);
}

/**
 * Concurrency-safe Login ID and Employee Code generator.
 * Employs row-level locking (FOR UPDATE) inside a transaction.
 * 
 * Satisfies FR-3 (Login ID auto-generation).
 */
export async function generateLoginIdAndEmpCode(
  tx: Prisma.TransactionClient,
  companyId: string,
  firstName: string,
  lastName: string,
  joiningYear: number
): Promise<{ loginId: string; empCode: string; sequence: number }> {
  // 1. Fetch company login prefix
  const company = await tx.companies.findUnique({
    where: { id: companyId },
    select: { login_prefix: true },
  });
  
  if (!company) {
    throw new BadRequestError('Company not found');
  }

  const prefix = company.login_prefix.toUpperCase();

  // 2. Perform row-level lock (FOR UPDATE) to prevent race conditions on concurrent sequence increments
  // Using queryRaw to lock the row in PostgreSQL
  const sequenceRows = await tx.$queryRaw<{ next_seq: number }[]>`
    SELECT next_seq 
    FROM login_id_sequences 
    WHERE company_id = ${companyId}::uuid AND joining_year = ${joiningYear}::smallint
    FOR UPDATE
  `;

  let currentSequence = 1;

  if (sequenceRows && sequenceRows.length > 0 && sequenceRows[0]) {
    currentSequence = sequenceRows[0].next_seq;
    
    // Increment sequence for next registration
    await tx.$executeRaw`
      UPDATE login_id_sequences
      SET next_seq = next_seq + 1
      WHERE company_id = ${companyId}::uuid AND joining_year = ${joiningYear}::smallint
    `;
  } else {
    // Insert initial sequence starting at 2 (since 1 is currently being used)
    await tx.login_id_sequences.create({
      data: {
        company_id: companyId,
        joining_year: joiningYear,
        next_seq: 2,
      },
    });
  }

  // 3. Construct Login ID format: [Prefix][FN][LN][Year][Seq]
  // FN and LN: first 2 letters, normalized
  const fnPart = normalizeNamePart(firstName);
  const lnPart = normalizeNamePart(lastName);
  const seqPart = currentSequence.toString().padStart(4, '0');
  
  const loginId = `${prefix}${fnPart}${lnPart}${joiningYear}${seqPart}`;
  
  // Construct Employee Code: EMP-YYYY-SEQ
  const empCode = `EMP-${joiningYear}-${seqPart}`;

  return {
    loginId,
    empCode,
    sequence: currentSequence,
  };
}
