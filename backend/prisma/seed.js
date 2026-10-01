import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding development database for Restaurant POS...');

  // Do not delete existing restaurant data when the seed is rerun.
  const existingOwner = await prisma.user.findUnique({
    where: { email: 'owner@pos.com' },
  });

  if (existingOwner && existingOwner.restaurantId) {
    console.log('Development seed already exists; leaving existing data untouched.');
    return;
  }
  if (existingOwner) {
    throw new Error('Seed owner email already exists without a restaurant; refusing to overwrite data.');
  }

  // 2. Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Spice Garden POS',
      address: '123 Gourmet Street, Foodville',
      phone: '+1 555-0199',
      email: 'contact@spicegarden.com',
      currency: 'USD',
      taxRate: 5.0,
    },
  });

  console.log(`Created Restaurant: ${restaurant.name} (${restaurant.id})`);

  // 3. Create Staff Users with hashed passwords
  const defaultPassword = await bcrypt.hash('Password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sarah Owner',
        email: 'owner@pos.com',
        password: defaultPassword,
        role: 'RESTAURANT_OWNER',
        phone: '+1 555-0101',
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Chef Marco',
        email: 'chef@pos.com',
        password: defaultPassword,
        role: 'KITCHEN_ADMIN',
        phone: '+1 555-0102',
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Alex Waiter',
        email: 'waiter@pos.com',
        password: defaultPassword,
        role: 'WAITER',
        phone: '+1 555-0103',
      },
    }),
    prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Emily Receptionist',
        email: 'receptionist@pos.com',
        password: defaultPassword,
        role: 'RECEPTIONIST',
        phone: '+1 555-0104',
      },
    }),
  ]);

  console.log(`Created ${users.length} staff members with roles: OWNER, KITCHEN_ADMIN, WAITER, RECEPTIONIST`);

  // 4. Create Tables
  const tables = await Promise.all([
    prisma.table.create({
      data: { restaurantId: restaurant.id, tableNumber: 'T1', capacity: 2, status: 'AVAILABLE' },
    }),
    prisma.table.create({
      data: { restaurantId: restaurant.id, tableNumber: 'T2', capacity: 4, status: 'AVAILABLE' },
    }),
    prisma.table.create({
      data: { restaurantId: restaurant.id, tableNumber: 'T3', capacity: 4, status: 'AVAILABLE' },
    }),
    prisma.table.create({
      data: { restaurantId: restaurant.id, tableNumber: 'T4', capacity: 6, status: 'AVAILABLE' },
    }),
  ]);

  console.log(`Created ${tables.length} dining tables`);

  // 5. Create Inventory Items
  const flour = await prisma.inventoryItem.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Flour (Atta)',
      sku: 'INV-FLOUR-01',
      currentStock: 50.0,
      minStockThreshold: 10.0,
      unit: 'KG',
      costPerUnit: 1.5,
    },
  });

  const water = await prisma.inventoryItem.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Water',
      sku: 'INV-WATER-01',
      currentStock: 200.0,
      minStockThreshold: 20.0,
      unit: 'LITER',
      costPerUnit: 0.05,
    },
  });

  const oil = await prisma.inventoryItem.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Cooking Oil',
      sku: 'INV-OIL-01',
      currentStock: 30.0,
      minStockThreshold: 5.0,
      unit: 'LITER',
      costPerUnit: 3.2,
    },
  });

  const salt = await prisma.inventoryItem.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Salt',
      sku: 'INV-SALT-01',
      currentStock: 15.0,
      minStockThreshold: 2.0,
      unit: 'KG',
      costPerUnit: 0.8,
    },
  });

  const chicken = await prisma.inventoryItem.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Fresh Chicken',
      sku: 'INV-CHICKEN-01',
      currentStock: 25.0,
      minStockThreshold: 5.0,
      unit: 'KG',
      costPerUnit: 6.0,
    },
  });

  console.log('Created inventory ingredients (Flour, Water, Oil, Salt, Chicken)');

  // 6. Create Menu Categories
  const breadsCat = await prisma.menuCategory.create({
    data: { restaurantId: restaurant.id, name: 'Breads', description: 'Freshly baked tandoori breads' },
  });

  const mainCat = await prisma.menuCategory.create({
    data: { restaurantId: restaurant.id, name: 'Main Course', description: 'Delicious curries and entrees' },
  });

  // 7. Create Menu Items
  const roti = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: breadsCat.id,
      name: 'Tandoori Roti',
      description: 'Crisp whole-wheat flatbread cooked in traditional clay tandoor',
      price: 2.5,
      isAvailable: true,
    },
  });

  const butterChicken = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mainCat.id,
      name: 'Butter Chicken',
      description: 'Tender chicken simmered in rich creamy tomato and butter gravy',
      price: 14.5,
      isAvailable: true,
    },
  });

  console.log('Created menu items (Tandoori Roti, Butter Chicken)');

  // 8. Create Recipe for Tandoori Roti
  const rotiRecipe = await prisma.recipe.create({
    data: {
      menuItemId: roti.id,
      instructions: 'Knead flour with water, oil and salt. Roll and cook inside clay tandoor until crisp.',
      prepTime: 8,
      ingredients: {
        create: [
          { inventoryItemId: flour.id, quantityRequired: 0.05, unit: 'KG' }, // 50g
          { inventoryItemId: water.id, quantityRequired: 0.03, unit: 'LITER' }, // 30ml
          { inventoryItemId: oil.id, quantityRequired: 0.005, unit: 'LITER' }, // 5ml
          { inventoryItemId: salt.id, quantityRequired: 0.002, unit: 'KG' }, // 2g
        ],
      },
    },
  });

  console.log('Created Recipe with ingredients for Tandoori Roti');

  // 9. Create Supplier
  const supplier = await prisma.supplier.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Metro Wholesale Grocers',
      contactPerson: 'David Miller',
      phone: '+1 555-0800',
      email: 'orders@metrowholesale.com',
      address: 'Industrial Area Phase 2',
    },
  });

  console.log(`Created Supplier: ${supplier.name}`);

  console.log('\n==================================================');
  console.log(' SEED DATA COMPLETED SUCCESSFULLY');
  console.log('==================================================');
  console.log('Demo Credentials (All passwords: Password123)');
  console.log('  Owner        : owner@pos.com');
  console.log('  Kitchen Admin: chef@pos.com');
  console.log('  Waiter       : waiter@pos.com');
  console.log('  Receptionist : receptionist@pos.com');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
