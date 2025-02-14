import { Request, Response, NextFunction } from 'express';
import { AuthService, RegisterDTO, LoginDTO } from '../services/auth.service';

export class AuthController {
  public static async register(
    req: Request<{}, {}, RegisterDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, username } = req.body;

      // Validate required fields
      if (!email || !password || !username) {
        return res.status(400).json({
          message: 'Email, password, and username are required'
        });
      }

      const result = await AuthService.register({ email, password, username });

      return res.json({
        message: 'User registered successfully',
        user: result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User already exists') {
          return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Invalid email format' ||
            error.message === 'Password does not meet requirements') {
          return res.status(400).json({ message: error.message });
        }
      }
      next(error);
    }
  }

  public static async login(
    req: Request<{}, {}, LoginDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      const result = await AuthService.login({ email, password });

      return res.json({
        message: 'Login successful',
        token: result.token
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' ||
            error.message === 'Invalid password') {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
      next(error);
    }
  }

  public static async logout(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: 'Token is required'
        });
      }

      await AuthService.logout({ token });

      // Perform logout operation
      return res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
