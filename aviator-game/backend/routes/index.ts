import { Router } from 'express';
// import { GameController } from '../controllers/game.controller';
// import { authGuard } from '../guards/guards';
import { RegisterDTO,LoginDTO } from '../services/auth.service';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User, users } from '../models/schema';
import { db } from '../db/database';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
export const router = Router();
// router.post('/bet', authGuard, GameController.placeBet);

// router.post('/cashout', authGuard, GameController.cashout);

import type { Request, Response, NextFunction, Express} from 'express';
import { AuthController } from '../controllers/auth.controller';

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    username: string;
  };
}

// router.post('/register', async (req: Express.Request, res: Express.Response) => {
//   try {
//     const { email, password, username } = (req as RegisterRequest).body;

//     // Check if user already exists
//     const existingUser = await db
//       .select()
//       .from(users)
//       .where(eq(users.email, email))
//       .get();

//     if (existingUser) {
//       return (res as any).status(400).json({ message: 'User already exists' });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(password, salt);

//     // Create new user
//     const newUser = await db
//       .insert(users)
//       .values({
//         id: crypto.randomUUID(),
//         email,
//         username,
//         passwordHash,
//         createdAt: new Date(),
//         role: 'user',
//         status: 'active'
//       })
//       .returning()
//       .get();

//     // Generate JWT
//     const token = jwt.sign(
//       { id: newUser.id },
//       process.env.JWT_SECRET!,
//       { expiresIn: '72h' }
//     );

//     return (res as any).status(201).json({ token });
//   } catch (error) {
//     console.error('Registration error:', error);
//     return (res as any).status(500).json({ message: 'Internal server error' });
//   }
// });

// router.post('/login', passport.authenticate('local'), (req, res) => {
//   const user = req.user as User;  // explicit type casting
//   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
//     expiresIn: '72h'
//   });
//   res.json({ token });
// });

router.post('/register', (req: Express.Request<{}, {}, RegisterDTO>, res: Express.Response, next: Express.NextFunction) => {
  return AuthController.register(req as any, res as any, next);
});

router.post('/login', (req: Express.Request<{}, {}, LoginDTO>, res: Express.Response, next: Express.NextFunction) => {
  return AuthController.login(req as any, res as any, next);
});
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as User;  // explicit type casting
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '72h'
    });
    // Redirect to frontend with token
    res.redirect(`/auth-callback?token=${token}`);
  }
);


// import { Router } from 'express';
// import type { Request, Response, NextFunction } from 'express';
// import passport from 'passport';
// import jwt from 'jsonwebtoken';
// import { User, users } from '../models/schema';
// import { db } from '../db/database';
// import bcrypt from 'bcrypt';
// import { eq } from 'drizzle-orm';

// export const router = Router();

// // Define interface for registration request body
// interface RegisterRequestBody {
//   email: string;
//   password: string;
//   username: string;
// }

// // Registration endpoint
// router.post(
//   '/register',
//   async (
//     req: Request<{}, {}, RegisterRequestBody>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     try {
//       const { email, password, username } = req.body;

//       // Validate required fields
//       if (!email || !password || !username) {
//         return res.status(400).json({
//           message: 'Email, password, and username are required'
//         });
//       }

//       // Check if user already exists
//       const existingUser = await db
//         .select()
//         .from(users)
//         .where(eq(users.email, email))
//         .get();

//       if (existingUser) {
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const passwordHash = await bcrypt.hash(password, salt);

//       // Create new user
//       const newUser = await db
//         .insert(users)
//         .values({
//           id: crypto.randomUUID(),
//           email,
//           username,
//           passwordHash,
//           createdAt: new Date(),
//           role: 'user',
//           status: 'active'
//         })
//         .returning()
//         .get();

//       // Generate JWT
//       const token = jwt.sign(
//         { id: newUser.id },
//         process.env.JWT_SECRET!,
//         { expiresIn: '72h' }
//       );

//       res.status(201).json({ token });
//     } catch (error) {
//       next(error); // Pass error to Express error handler
//     }
//   }
// );

// // Define interface for login request body
// interface LoginRequestBody {
//   email: string;
//   password: string;
// }

// // Login endpoint
// router.post(
//   '/login',
//   passport.authenticate('local'),
//   (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
//     const user = req.user as User;
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
//       expiresIn: '72h'
//     });
//     res.json({ token });
//   }
// );

// // Google OAuth routes
// router.get(
//   '/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get(
//   '/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req: Request, res: Response) => {
//     const user = req.user as User;
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
//       expiresIn: '72h'
//     });
//     res.redirect(`/auth-callback?token=${token}`);
//   }
// );

// // Error handling middleware
// router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error('Auth error:', err);
//   res.status(500).json({ message: 'Internal server error' });
// });

// import { Router } from 'express';
// import { AuthController } from '../controllers/auth.controller';
// import passport from 'passport';
// import jwt from 'jsonwebtoken';
// import { Request, Response, NextFunction } from 'express';
// import { RegisterDTO, LoginDTO } from '../services/auth.service';

// export const router = Router();

// // Register route - bind the static method to preserve correct types
// router.post('/register', (req: Request<{}, {}, RegisterDTO>, res: Response, next: NextFunction) => {
//   return AuthController.register(req, res, next);
// });

// // Login route - bind the static method to preserve correct types
// router.post('/login', (req: Request<{}, {}, LoginDTO>, res: Response, next: NextFunction) => {
//   return AuthController.login(req, res, next);
// });

// // Google OAuth routes
// router.get(
//   '/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get(
//   '/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req: Request, res: Response) => {
//     const user = req.user as Express.User;
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
//       expiresIn: '72h'
//     });
//     res.redirect(`/auth-callback?token=${token}`);
//   }
// );

// // Error handling middleware
// router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error('Auth error:', err);
//   res.status(500).json({ message: 'Internal server error' });
// });
