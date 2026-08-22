import { PrismaClient, Prisma } from '@prisma/client';

// Type for the Prisma transaction client
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * Login ID Generator (FR-3).
 *
 * Format: [loginPrefix][first2OfFirstName + first2OfLastName][YYYY joiningYear][4-digit sequence]
 * Example: OIJODO20220001
 *
 * The sequence is per company per joining year, stored in `login_id_sequences`.
 * Uses raw SQL with INSERT ... ON CONFLICT for atomic increment to prevent race
 * conditions on concurrent employee creation (still parameterized — Security Checklist #6).
 */

/**
 * Extract the first N characters from a name, uppercased.
 * Pads with 'X' if the name is shorter than N characters.
 */
export function extractNameChars(name: string, count: number): string {
  // Remove non-alpha chars and take first `count` chars
  const cleaned = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  return cleaned.slice(0, count).padEnd(count, 'X');
}

/**
 * Generate a Login ID for a new employee.
 *
 * MUST be called inside a Prisma interactive transaction ($transaction with the
 * callback form) to guarantee the sequence number is unique even under concurrent
 * employee creation.
 *
 * @param tx - Prisma transaction client (NOT the root PrismaClient)
 * @param companyId - UUID of the company
 * @param loginPrefix - The company's login prefix (e.g. 'OI')
 * @param firstName - Employee's first name
 * @param lastName - Employee's last name
 * @param joiningYear - 4-digit year of joining (e.g. 2022)
 */
export async function generateLoginId(
  tx: TxClient,
  companyId: string,
  loginPrefix: string,
  firstName: string,
  lastName: string,
  joiningYear: number,
): Promise<string> {
  // Atomically get-and-increment the sequence number.
  // INSERT ... ON CONFLICT ... DO UPDATE SET next_seq = next_seq + 1
  // RETURNING the value *before* increment (i.e. the current sequence to use).
  //
  // This is a parameterized query ($1, $2) — NOT string concatenation (Security Checklist #6).
  const sequence = await tx.login_id_sequences.upsert({
    where: {
      company_id_joining_year: {
        company_id: companyId,
        joining_year: joiningYear,
      },
    },
    update: {
      next_seq: { increment: 1 },
    },
    create: {
      company_id: companyId,
      joining_year: joiningYear,
      next_seq: 2,
    },
  });

  // The upsert returns the NEW record (so next_seq is already incremented).
  // The sequence number to use for this user is the returned next_seq - 1.
  const seq = sequence.next_seq - 1;

  // Build the Login ID
  const nameChars = extractNameChars(firstName, 2) + extractNameChars(lastName, 2);
  const seqStr = String(seq).padStart(4, '0');

  return `${loginPrefix.toUpperCase()}${nameChars}${joiningYear}${seqStr}`;
}

/**
 * Generate an employee code.
 * Format: EMP-[4-digit sequence]
 *
 * Uses the total user count in the company + 1 as the sequence number.
 * Called within a transaction to avoid race conditions.
 */
export async function generateEmpCode(
  tx: TxClient,
  companyId: string,
): Promise<string> {
  const count = await tx.users.count({
    where: { company_id: companyId },
  });
  return `EMP-${String(count + 1).padStart(4, '0')}`;
}
