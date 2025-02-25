import { Request, Response, NextFunction } from 'express';
import { PhoneVerificationService } from '../services/phoneverification.service';
import { db } from '../db/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { User } from '../types/express/index';

export class PhoneVerificationController {
  public static async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber } = req.body;
        const user = req.user as User | undefined;

      if (!user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await PhoneVerificationService.sendOTP(phoneNumber, user.id);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { otp } = req.body;
      const user = req.user as User | undefined;

      if (!user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const isValid = await PhoneVerificationService.verifyOTP(user.id, otp);

      if (!isValid) {
        res.status(400).json({ message: 'Invalid or expired OTP' });
        return;
      }

      await db
        .update(users)
        .set({ phoneVerified: true })
        .where(eq(users.id, user.id));

      res.json({ message: 'Phone number verified successfully' });
    } catch (error) {
      next(error);
    }
  }
}
