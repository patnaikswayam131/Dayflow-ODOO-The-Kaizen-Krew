import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { generateLoginId, generateEmpCode } from '../src/services/loginId.service.js';
import { generateSecurePassword } from '../src/services/password.service.js';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// Type for the Prisma transaction client
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

async function main() {
  console.log('Clearing database...');
  await prisma.users.deleteMany();
  await prisma.companies.deleteMany();

  console.log('Seeding initial data...');
  const now = new Date();
  const joiningYear = now.getFullYear();

  const adminPassword = 'AdminPassword1!';
  const employeePassword = 'EmployeePassword1!';

  const adminPasswordHash = await hashPassword(adminPassword);
  const employeePasswordHash = await hashPassword(employeePassword);

  const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    // 1. Create company
    const company = await tx.companies.create({
      data: {
        name: 'Dayflow',
        login_prefix: 'DF',
      },
    });

    // 2. Seed default leave types for the company
    await tx.leave_types.createMany({
      data: [
        {
          company_id: company.id,
          name: 'Paid Time Off',
          is_paid: true,
          requires_attachment: false,
          default_allocation_days: 24,
        },
        {
          company_id: company.id,
          name: 'Sick Leave',
          is_paid: true,
          requires_attachment: true,
          default_allocation_days: 7,
        },
        {
          company_id: company.id,
          name: 'Unpaid Leave',
          is_paid: false,
          requires_attachment: false,
          default_allocation_days: 0,
        },
      ],
    });

    // 3. Create Admin User
    const adminLoginId = await generateLoginId(
      tx as unknown as TxClient,
      company.id,
      company.login_prefix,
      'Admin',
      'User',
      joiningYear,
    );
    const adminEmpCode = await generateEmpCode(tx as unknown as TxClient, company.id);

    const admin = await tx.users.create({
      data: {
        company_id: company.id,
        login_id: adminLoginId,
        emp_code: adminEmpCode,
        email: 'admin@dayflow.com',
        password_hash: adminPasswordHash,
        must_change_password: false,
        role: 'ADMIN',
        status: 'ACTIVE',
        first_name: 'Admin',
        last_name: 'User',
        date_of_joining: now,
        email_verified: true, 
      },
    });

    // 4. Create Employee User
    const empLoginId = await generateLoginId(
      tx as unknown as TxClient,
      company.id,
      company.login_prefix,
      'John',
      'Doe',
      joiningYear,
    );
    const empEmpCode = await generateEmpCode(tx as unknown as TxClient, company.id);

    const employee = await tx.users.create({
      data: {
        company_id: company.id,
        login_id: empLoginId,
        emp_code: empEmpCode,
        email: 'employee@dayflow.com',
        password_hash: employeePasswordHash,
        must_change_password: false,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        first_name: 'John',
        last_name: 'Doe',
        date_of_joining: now,
        email_verified: true,
      },
    });

    return { company, admin, employee };
  });

  console.log('\n=============================================');
  console.log('✅ Seed successful! Database populated.');
  console.log('=============================================');
  console.log('\n🏢 Company: Dayflow');
  
  console.log('\n👑 ADMIN Credentials:');
  console.log(`   Login ID : ${result.admin.login_id}`);
  console.log(`   Email    : ${result.admin.email}`);
  console.log(`   Password : ${adminPassword}`);

  console.log('\n👤 EMPLOYEE Credentials:');
  console.log(`   Login ID : ${result.employee.login_id}`);
  console.log(`   Email    : ${result.employee.email}`);
  console.log(`   Password : ${employeePassword}`);
  console.log('\n=============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
