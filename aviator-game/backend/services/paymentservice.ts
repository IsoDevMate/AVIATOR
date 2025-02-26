import { db } from '../db/database';
import { transactions, users, InsertUser,InsertTransaction } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import axios from 'axios';
import { WebSocket } from 'ws';
import { mpesaConfig, paypalConfig } from '../config/payments';
interface PaymentDetails {
  amount: number;
  currency: string;
  userId: string;
  method: 'mpesa' | 'paypal';
  phoneNumber?: string;
}
interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
}

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

// // Initialize the payment service
// const paymentService = PaymentService.getInstance(mpesaConfig, paypalConfig);

export class PaymentService {
  private static instance: PaymentService;
  private connectedClients: Map<string, WebSocket> = new Map();



  private constructor(
    private mpesaConfig: MpesaConfig,
    private paypalConfig: PayPalConfig
  ) { }

  static getInstance(mpesaConfig: MpesaConfig, paypalConfig: PayPalConfig) {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService(mpesaConfig, paypalConfig);
    }
    return PaymentService.instance;
  }


  registerClient(userId: string, ws: WebSocket) {
    this.connectedClients.set(userId, ws);
  }

  removeClient(userId: string) {
    this.connectedClients.delete(userId);
  }


  private async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    // Basic Kenyan phone number validation
    const phoneRegex = /^254[17]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }

  private async ensureValidPhoneNumber(userId: string, phoneNumber?: string): Promise<string> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) throw new Error('User not found');

    // If phone number is provided, validate and update it
    if (phoneNumber) {
      if (!await this.validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use format: 254XXXXXXXXX');
      }

      // Update user's phone number if it's different
      if (user.phoneNumber !== phoneNumber) {
        await db
          .update(users)
          .set({
            phoneNumber,
            phoneVerified: false
          })
          .where(eq(users.id, userId));
      }

      return phoneNumber;
    }

    // If no phone number provided, check if user has a verified number
    if (!user.phoneNumber) {
      throw new Error('Please add a phone number for M-Pesa transactions');
    }

    if (!user.phoneVerified) {
      throw new Error('Please verify your phone number first');
    }

    if (typeof user.phoneNumber === 'string') {
      return user.phoneNumber;
    }
    throw new Error('User phone number is not valid');
  }

  private async updateUserBalance(userId: string, amount: number, transactionType: 'deposit' | 'withdrawal') {
    await db.transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx
        .update(users)
        .set({
          balance: sql`balance + ${amount}`,
        })
        .where(eq(users.id, userId))
        .returning()
        .get();

      // Record transaction
      const transactionId = crypto.randomUUID();
      const insertData: InsertTransaction = {
        id: transactionId,
        userId,
        type: transactionType,
        amount,
        status: 'completed',
        createdAt: new Date(),
      };
      await tx.insert(transactions).values(insertData).execute();

      // Notify connected client about balance update
      const ws = this.connectedClients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'balance_update',
          data: {
            balance: updatedUser.balance,
            transactionId,
            transactionType
          }
        }));
      }

      return updatedUser;
    });
  }

  async initiateDeposit(details: PaymentDetails) {
    const { amount, currency, userId, method } = details;

    if (method === 'mpesa') {
      return await this.initiateMpesaDeposit(details);
    } else if (method === 'paypal') {
      return await this.initiatePayPalDeposit(details);
    }

    throw new Error('Unsupported payment method');
  }

  async initiateWithdrawal(details: PaymentDetails) {
    const { amount, userId, method } = details;

    //Check  for user has sufficient balance
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user || typeof user.balance !== 'number' || user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    if (method === 'mpesa') {
      return await this.initiateMpesaWithdrawal(details);
    } else if (method === 'paypal') {
      return await this.initiatePayPalWithdrawal(details);
    }

    throw new Error('Unsupported withdrawal method');
  }

  private async initiateMpesaDeposit(details: PaymentDetails) {
    const { amount, userId, phoneNumber } = details;

    const validatedPhone = await this.ensureValidPhoneNumber(userId, phoneNumber);


    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${this.mpesaConfig.shortcode}${this.mpesaConfig.passkey}${timestamp}`
    ).toString('base64');

    const consumerKey = this.mpesaConfig.consumerKey;
    const consumerSecret = this.mpesaConfig.consumerSecret;
    const shortcode = this.mpesaConfig.shortcode;
    console.log("consumerKey",consumerKey,"condumerSecret", consumerSecret);
    try {

      const authResponse = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          auth: {
            username: consumerKey,
            password: consumerSecret
          }
        }
      );
      const phone = validatedPhone.substring(4);
      console.log("phone", phone);
      const callbackUrl = this.mpesaConfig.callbackUrl;
      console.log("callbackUrl", callbackUrl);
      //Initiating STK push
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phone,
          PartyB: this.mpesaConfig.shortcode,
          PhoneNumber: `254${phone}` || '0793043014',
          CallBackURL: `${callbackUrl}/stk_callback`,
          AccountReference: `Deposit-${userId}`,
          TransactionDesc: 'Game Deposit'
        },
        {
          headers: {
        Authorization: `Bearer ${authResponse.data.access_token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('M-PESA deposit error:', error);
      throw new Error('Failed to initiate M-PESA deposit');
    }
  }

  private async initiatePayPalDeposit(details: PaymentDetails) {
    const { amount, currency, userId } = details;

    try {
      // PayPal order
      const order = await axios.post(
        `${this.paypalConfig.environment === 'sandbox' ?
          'https://api-m.sandbox.paypal.com' :
          'https://api-m.paypal.com'}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount.toString()
            },
            custom_id: userId
          }]
        },
        {
          auth: {
            username: this.paypalConfig.clientId,
            password: this.paypalConfig.clientSecret
          }
        }
      );

      return order.data;
    } catch (error) {
      console.error('PayPal deposit error:', error);
      throw new Error('Failed to initiate PayPal deposit');
    }
  }

  private async initiateMpesaWithdrawal(details: PaymentDetails) {
      const { amount, userId, phoneNumber } = details;

    const validatedPhone = await this.ensureValidPhoneNumber(userId, phoneNumber);


    try {
      const securityCredential = Buffer.from(
        `${this.mpesaConfig.shortcode}${this.mpesaConfig.passkey}`
      ).toString('base64');

      const authResponse = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate',
        {
          auth: {
            username: this.mpesaConfig.consumerKey,
            password: this.mpesaConfig.consumerSecret
          }
        }
      );

      //Initiating  B2C payment for daraja sdk
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
        {
          InitiatorName: 'testapi',
          SecurityCredential: securityCredential,
          CommandID: 'BusinessPayment',
          Amount: amount,
          PartyA: this.mpesaConfig.shortcode,
          PartyB: validatedPhone,
          Remarks: 'Game Withdrawal',
          QueueTimeOutURL: `${this.mpesaConfig.callbackUrl}/timeout`,
          ResultURL: `${this.mpesaConfig.callbackUrl}/result`,
          Occasion: `Withdrawal-${userId}`
        },
        {
          headers: {
            Authorization: `Bearer ${authResponse.data.access_token}`
          }
        }
      );

      await this.updateUserBalance(userId, -amount, 'withdrawal');
      return response.data;
    } catch (error) {
      console.error('M-PESA withdrawal error:', error);
      throw new Error('Failed to initiate M-PESA withdrawal');
    }
  }

  private async initiatePayPalWithdrawal(details: PaymentDetails) {
    const { amount, currency, userId } = details;

    try {
      //PayPal payouts
      const payout = await axios.post(
        `${this.paypalConfig.environment === 'sandbox' ?
          'https://api-m.sandbox.paypal.com' :
          'https://api-m.paypal.com'}/v1/payments/payouts`,
        {
          sender_batch_header: {
            sender_batch_id: `Withdrawal-${userId}-${Date.now()}`,
            email_subject: 'You have a payment'
          },
          items: [{
            recipient_type: 'EMAIL',
            amount: {
              value: amount,
              currency
            },
            sender_item_id: userId
          }]
        },
        {
          auth: {
            username: this.paypalConfig.clientId,
            password: this.paypalConfig.clientSecret
          }
        }
      );

      await this.updateUserBalance(userId, -amount, 'withdrawal');
      return payout.data;
    } catch (error) {
      console.error('PayPal withdrawal error:', error);
      throw new Error('Failed to initiate PayPal withdrawal');
    }
  }

  // Webhook handlers
  async handleMpesaCallback(data: any) {
    const { ResultCode, TransactionAmount, TransID } = data.Body.stkCallback;

    if (ResultCode === 0) {
      // Transaction success
      const userId = data.Body.stkCallback.CallbackMetadata.Item.find(
        (item: any) => item.Name === 'PhoneNumber'
      ).Value;

      await this.updateUserBalance(userId, TransactionAmount, 'deposit');
    }
  }

  async handlePayPalWebhook(data: any) {
    if (data.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const userId = data.resource.purchase_units[0].custom_id;
      const amount = parseFloat(data.resource.purchase_units[0].amount.value);

      await this.updateUserBalance(userId, amount, 'deposit');
    }
  }
}
