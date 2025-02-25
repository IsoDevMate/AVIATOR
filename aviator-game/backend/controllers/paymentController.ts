import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentservice';
import { mpesaConfig, paypalConfig } from '../config/payments';
import { User } from '../models/schema';
export class PaymentController {
  private static paymentService = PaymentService.getInstance(mpesaConfig, paypalConfig);

public static async initiateDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, currency, method } = req.body;
      const user = req.user as User | undefined;

      if (!user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const result = await PaymentController.paymentService.initiateDeposit({
        amount,
        currency,
        userId: user.id,
        method
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

public static async initiateWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, currency, method } = req.body;
        const user = req.user as User | undefined;
        
      if (!user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const result = await PaymentController.paymentService.initiateWithdrawal({
        amount,
        currency,
        userId: user.id,
        method
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
    }

  // Webhook handlers
  static async handleMpesaWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await PaymentController.paymentService.handleMpesaCallback(req.body);
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async handlePayPalWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await PaymentController.paymentService.handlePayPalWebhook(req.body);
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
