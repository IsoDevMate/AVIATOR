import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from '../db/database';
import { users } from '../models/schema';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';

// Define JWT payload type
interface JWTPayload {
  id: string;
  iat: number;
  exp: number;
}

// Define the User type based on your schema
type User = InferSelectModel<typeof users>;

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET'
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, async (_, __, profile, done) => {
    try {
      // Check for existing user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.googleId, profile.id))
        .get();

      if (existingUser) {
        return done(null, existingUser);
      }

      // Create new user if none exists
      const newUser = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: profile.emails?.[0].value ?? '',
          username: profile.displayName || profile.emails?.[0].value.split('@')[0] || '',
          passwordHash: '', // Empty for OAuth users
          googleId: profile.id,
          createdAt: new Date(),
          role: 'user',
          status: 'active'
        })
        .returning()
        .get();

      return done(null, newUser);
    } catch (error) {
      return done(error as Error);
    }
  }));
}



// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

// Serialize user for JWT
passport.serializeUser((user: User, done) => {
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '72h' }
  );
  done(null, token);
});

// Deserialize user from JWT
passport.deserializeUser(async (token: string, done) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .get();

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
});

// Type augmentation for Express
declare global {
  namespace Express {
    interface User extends InferSelectModel<typeof users> {}
  }
}

export default passport;
