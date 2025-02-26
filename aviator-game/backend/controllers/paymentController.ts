import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentservice';
import { mpesaConfig, paypalConfig } from '../config/payments';
import { User } from '../models/schema';
import request from 'request';
export class PaymentController {
  private static paymentService = PaymentService.getInstance(mpesaConfig, paypalConfig);

public static async initiateDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, currency, method } = req.body;
      const user = req.user as User | undefined;
       const token = { accessToken: req.headers.authorization?.split(' ')[1] || '' };
      if (!user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!amount || !currency || !method) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      if (method === 'mpesa' && !req.body.phoneNumber) {
        res.status(400).json({ message: 'Missing required fields' });
        return
      }

      if (!token) {
        res.status(401).json({ message: 'mpesa accesstoken not given thus Unauthorized' });
        return;
      }


      const result = await PaymentController.paymentService.initiateDeposit({
        amount,
        currency,
        userId: user.id,
        method
      }, token);

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
      const token = { accessToken: req.headers.authorization?.split(' ')[1] || '' };

         if (!amount || !currency || !method) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      if (method === 'mpesa' && !req.body.phoneNumber) {
        res.status(400).json({ message: 'Missing required fields' });
        return
      }

      if (!token) {
        res.status(401).json({ message: 'mpesa accesstoken not given thus Unauthorized' });
        return;
      }

      const result = await PaymentController.paymentService.initiateWithdrawal({
        amount,
        currency,
        userId: user.id,
        method
      },token);

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
