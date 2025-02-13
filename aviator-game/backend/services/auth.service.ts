import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { tokenBlacklist } from '../models/schema';
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  lastLoginAt?: Date;
  status: 'active' | 'suspended' | 'banned';
}
export interface RegisterDTO {
  email: string;
  password: string;
  username: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LogoutDTO {
  token: string;
}

export class AuthService {
  private static generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '72h' }
    );
  }

  private static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public static async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static async validatePassword(password: string): Promise<boolean> {
    // Password must contain at least one lowercase letter, one uppercase letter, one digit, and be at least 8 characters long
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  // Example of a valid password: "Password123"
  // This password contains at least one lowercase letter, one uppercase letter, one digit, and is at least 8 characters long

  public static async register(data: RegisterDTO) {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate email and password
    const isEmailValid = await this.validateEmail(data.email);
    if (!isEmailValid) {
      throw new Error('Invalid email format');
    }

    const isPasswordValid = await this.validatePassword(data.password);
    if (!isPasswordValid) {
      throw new Error('Password does not meet requirements');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        username: data.username,
        passwordHash,
        createdAt: new Date(),
        role: 'user',
        status: 'active'
      })
      .returning()
      .get();

    return newUser;
  }

  public static async login(data: LoginDTO) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user.id);

    return { user, token };
  }

  public static async logout(data: LogoutDTO) {
    // Invalidate the token by adding it to a blacklist or removing it from a whitelist
    // This example assumes you have a token blacklist table in your database

    await db
      .insert(tokenBlacklist)
      .values({
        token: data.token,
        expiresAt: new Date()
      })
      .execute();

    return { message: 'Logout successful' };
  }
}
