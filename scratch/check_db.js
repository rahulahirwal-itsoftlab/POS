import { prisma } from '../backend/src/config/env.js';

async function main() {
  const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'`;
  console.log('Payment Columns:', cols);
  
  const paymentMethods = await prisma.$queryRaw`SELECT enum_range(NULL::"PaymentMethod")`;
  console.log('PaymentMethod Enum values:', paymentMethods);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
