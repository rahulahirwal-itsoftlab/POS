import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setSingleAnnualPlan() {
  console.log('Configuring single 5000/yr plan in database...');

  // 1. Create or upsert the single Annual Plan
  const singlePlan = await prisma.plan.upsert({
    where: { name: 'Standard Annual Plan' },
    update: {
      description: 'Annual restaurant subscription: 10 Waiters, 2 Kitchen Admins, 2 Receptionists',
      price: 5000.00,
      durationDays: 365,
      maxStaff: 14,
      maxWaiters: 10,
      maxKitchenAdmins: 2,
      maxReceptionists: 2,
      features: [
        '10 Service Waiters (POS & Floor Map)',
        '2 Kitchen Admins (Live KDS & Recipes)',
        '2 Receptionists (Billing & Cashier)',
        'Complete Restaurant Operations & Reports',
        'Valid for 1 Full Year'
      ],
      isActive: true,
    },
    create: {
      name: 'Standard Annual Plan',
      description: 'Annual restaurant subscription: 10 Waiters, 2 Kitchen Admins, 2 Receptionists',
      price: 5000.00,
      durationDays: 365,
      maxStaff: 14,
      maxWaiters: 10,
      maxKitchenAdmins: 2,
      maxReceptionists: 2,
      features: [
        '10 Service Waiters (POS & Floor Map)',
        '2 Kitchen Admins (Live KDS & Recipes)',
        '2 Receptionists (Billing & Cashier)',
        'Complete Restaurant Operations & Reports',
        'Valid for 1 Full Year'
      ],
      isActive: true,
    },
  });

  console.log(`Single Plan active: ${singlePlan.name} (ID: ${singlePlan.id}) - Price: ${singlePlan.price}/year`);

  // 2. Re-point ALL subscriptions to this single plan
  const updatedSubs = await prisma.subscription.updateMany({
    data: {
      planId: singlePlan.id,
      status: 'ACTIVE',
    },
  });
  console.log(`Re-pointed ${updatedSubs.count} restaurant subscriptions to the single annual plan.`);

  // 3. Delete or deactivate any old plans so only this one plan exists
  const otherPlans = await prisma.plan.findMany({
    where: {
      id: { not: singlePlan.id },
    },
  });

  for (const oldPlan of otherPlans) {
    try {
      await prisma.plan.delete({ where: { id: oldPlan.id } });
      console.log(`Deleted old plan: ${oldPlan.name}`);
    } catch {
      await prisma.plan.update({
        where: { id: oldPlan.id },
        data: { isActive: false },
      });
      console.log(`Archived old plan: ${oldPlan.name}`);
    }
  }

  // 4. Verify only the single active plan exists
  const activePlans = await prisma.plan.findMany({ where: { isActive: true } });
  console.log(`Active plans count: ${activePlans.length}`);
  for (const p of activePlans) {
    console.log(` -> ${p.name}: ₹${p.price}/year (${p.maxWaiters} Waiters, ${p.maxKitchenAdmins} Kitchen Admins, ${p.maxReceptionists} Receptionists)`);
  }
}

setSingleAnnualPlan()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
