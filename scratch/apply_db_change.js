import { prisma } from '../backend/src/config/env.js';

async function main() {
  console.log('Applying DB migration for Razorpay...');
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = '"PaymentMethod"'::regtype 
        AND enumlabel = 'RAZORPAY'
      ) THEN
        ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';
      END IF;
    END
    $$;
  `);
  console.log('Added RAZORPAY to PaymentMethod enum.');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "payments" 
    ADD COLUMN IF NOT EXISTS "provider" TEXT,
    ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT,
    ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT,
    ADD COLUMN IF NOT EXISTS "razorpaySignature" TEXT;
  `);
  console.log('Added Razorpay columns to payments table.');

  const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'`;
  console.log('Updated Payment Columns:', cols);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
