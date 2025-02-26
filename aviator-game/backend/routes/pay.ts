import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateJwt } from '../middleware/auth.middleware';
import { PhoneVerificationController } from '../controllers/phoneVerification.controller';
import { getAccessToken } from '../middleware/acccesstoken';
export const paymentRouter = Router();



// Phone verification routes
paymentRouter.post('/verify-phone/send-otp', authenticateJwt, PhoneVerificationController.sendOTP);
paymentRouter.post('/verify-phone/verify-otp', authenticateJwt, PhoneVerificationController.verifyOTP);

// Payment routes
paymentRouter.post('/deposit', authenticateJwt,getAccessToken, PaymentController.initiateDeposit);
paymentRouter.post('/withdraw', authenticateJwt,getAccessToken, PaymentController.initiateWithdrawal);

// Webhook routes (no authentication required as they're called by payment providers)
paymentRouter.post('/webhook/mpesa', PaymentController.handleMpesaWebhook);
paymentRouter.post('/webhook/paypal', PaymentController.handlePayPalWebhook);
