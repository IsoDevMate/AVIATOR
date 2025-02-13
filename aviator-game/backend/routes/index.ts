import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { RegisterDTO, LoginDTO } from '../services/auth.service';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/schema';

export const router = Router();

// Register route - Fixed type definitions
router.post(
  '/register',
  async (
    req: Request<{}, {}, RegisterDTO>,
    res: Response,
    next: NextFunction
  ) => {
    await AuthController.register(req, res, next);
  }
);

// Login route - Fixed type definitions
router.post(
  '/login',
  async (
    req: Request<{}, {}, LoginDTO>,
    res: Response,
    next: NextFunction
  ) => {
    await AuthController.login(req, res, next);
  }
);

// Logout route
router.post('/logout', async (req: Request, res: Response) => {
  await AuthController.logout(req, res);
});

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as User;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '72h'
    });
    res.redirect(`/auth-callback?token=${token}`);
  }
);

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Auth error:', err);
  res.status(500).json({ message: 'Internal server error' });
});
