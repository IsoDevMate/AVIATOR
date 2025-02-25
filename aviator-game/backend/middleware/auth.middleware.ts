// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error('JWT Authentication Error:', err);
      return next(err);
    }

    if (!user) {
      console.log('JWT Authentication Failed:', info?.message);
      return res.status(401).json({ message: info?.message || 'Unauthorized' });
    }

    req.user = user;
    next();
  })(req, res, next);
};
