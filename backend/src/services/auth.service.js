import { prisma } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const registerOwner = async (data) => {
  const email = data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(data.password);

  return await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: data.restaurantName || data.restaurant_name,
        address: data.address || null,
        phone: data.phone || null,
        email,
        currency: data.currency || 'USD',
        taxRate: data.taxRate !== undefined ? Number(data.taxRate) : (data.tax_rate !== undefined ? Number(data.tax_rate) : 5.0),
      },
    });

    const user = await tx.user.create({
      data: {
        restaurantId: restaurant.id,
        name: data.name,
        email,
        password: hashedPassword,
        role: 'RESTAURANT_OWNER',
        phone: data.phone || null,
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      restaurantId: restaurant.id,
    });

    return { user, restaurant, token };
  });
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User account has been deactivated. Please contact your restaurant owner.');
    error.statusCode = 403;
    throw error;
  }

  if (user.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
    });
    if (restaurant && !restaurant.isActive) {
      const error = new Error('This restaurant establishment has been suspended. Please contact platform administration.');
      error.statusCode = 403;
      throw error;
    }
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    restaurantId: user.restaurantId,
  });

  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
  };

  return {
    user: userWithoutPassword,
    token,
  };
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      restaurantId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
      restaurant: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
  });
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const updateProfile = async (userId, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.email) {
    const nextEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email: nextEmail, NOT: { id: userId } },
    });
    if (existing) {
      const error = new Error('This email address is already in use');
      error.statusCode = 409;
      throw error;
    }
    updateData.email = nextEmail;
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      restaurantId: true,
    },
  });
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!newPassword || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password updated successfully' };
};

export default {
  registerOwner,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
