import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPlansAndSuperAdmin() {
  console.log('Seeding Plans and Super Admin...');

  const plans = [
    {
      name: 'Starter Plan',
      description: 'Ideal for small cafes, quick-service counters, and bistros.',
      price: 1499.00,
      durationDays: 30,
      maxStaff: 3,
      maxTables: 6,
      maxMenuItems: 30,
      features: ['Basic POS', 'Kitchen Display', 'Receipt Billing', 'Basic Reports'],
      isActive: true,
    },
    {
      name: 'Professional Plan',
      description: 'Designed for full-service dining restaurants with active staff and tables.',
      price: 3999.00,
      durationDays: 30,
      maxStaff: 12,
      maxTables: 25,
      maxMenuItems: 150,
      features: ['Full POS Terminal', 'Multi-KDS Support', 'Advanced Inventory & BOM Recipes', 'Supplier & Purchases', 'Financial Reports'],
      isActive: true,
    },
    {
      name: 'Enterprise Plan',
      description: 'Unlimited power for high-volume restaurants, multi-floor lounges, and bars.',
      price: 7999.00,
      durationDays: 30,
      maxStaff: 50,
      maxTables: 100,
      maxMenuItems: 500,
      features: ['High-Capacity Floor Map', 'Unlimited Operations', 'Priority Platform Support', 'Complete Analytics & Wastage Tracking'],
      isActive: true,
    },
  ];

  const seededPlans = [];
  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
      update: {
        description: p.description,
        price: p.price,
        maxStaff: p.maxStaff,
        maxTables: p.maxTables,
        maxMenuItems: p.maxMenuItems,
        features: p.features,
      },
      create: p,
    });
    seededPlans.push(plan);
    console.log(`Plan verified: ${plan.name} (${plan.id})`);
  }

  const superAdminEmail = 'admin@pos.com';
  const hashedSuperPassword = await bcrypt.hash('Password123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      role: 'RESTAURANT_REGISTRATION_ADMIN',
      isActive: true,
    },
    create: {
      name: 'Platform Super Admin',
      email: superAdminEmail,
      password: hashedSuperPassword,
      role: 'RESTAURANT_REGISTRATION_ADMIN',
      isActive: true,
    },
  });
  console.log(`Platform Super Admin verified: ${superAdmin.email} (Role: ${superAdmin.role})`);

  const proPlan = seededPlans.find(p => p.name === 'Professional Plan') || seededPlans[0];
  const restaurants = await prisma.restaurant.findMany({
    include: { subscription: true },
  });

  for (const rest of restaurants) {
    if (!rest.subscription) {
      const sub = await prisma.subscription.create({
        data: {
          restaurantId: rest.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`Attached ${proPlan.name} to restaurant "${rest.name}" (subId: ${sub.id})`);
    } else {
      console.log(`Restaurant "${rest.name}" already has subscription.`);
    }
  }

  console.log('Seeding complete.');
}

seedPlansAndSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
