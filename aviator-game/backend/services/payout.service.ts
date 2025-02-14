// // import { PayPalService } from '@paypal/payouts-sdk';

// // export class PayoutService {
// //   private static instance: PayoutService;
// //   private paypalClient: PayPalService;

// //   static getInstance() {
// //     if (!PayoutService.instance) {
// //       PayoutService.instance = new PayoutService();
// //     }
// //     return PayoutService.instance;
// //   }

// //   async processPayout(userId: string, amount: number) {
// //     const user = await db.select().from(users).where({ id: userId }).first();

// //     if (!user.paypalEmail) {
// //       throw new Error('PayPal email not configured');
// //     }

// //     const payout = {
// //       sender_batch_header: {
// //         email_subject: "You have a payout from Aviator Game!",
// //         email_message: "You have received a payout from your Aviator Game winnings."
// //       },
// //       items: [{
// //         recipient_type: "EMAIL",
// //         amount: {
// //           value: amount.toString(),
// //           currency: "USD"
// //         },
// //         receiver: user.paypalEmail,
// //         note: "Aviator Game Payout",
// //         sender_item_id: crypto.randomUUID()
// //       }]
// //     };

// //     try {
// //       const response = await this.paypalClient.createPayout(payout);
// //       return response;
// //     } catch (error) {
// //       console.error('PayPal payout failed:', error);
// //       throw new Error('Payout processing failed');
// //     }
// //   }
// // }


// // import { PayPalHttpClient, Environment } from '@paypal/checkout-server-sdk';
// // import { config } from '../config/config';

// // export class PayPalService {
// //   private client: PayPalHttpClient;

// //   constructor() {
// //     const environment = config.isProd
// //       ? new Environment.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
// //       : new Environment.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);

// //     this.client = new PayPalHttpClient(environment);
// //   }

// //   async processPayout(userId: string, amount: number): Promise<string> {
// //     try {
// //       const user = await db.query.users.findFirst({
// //         where: eq(users.id, userId)
// //       });

// //       const request = new PayoutsPostRequest();
// //       request.requestBody({
// //         sender_batch_header: {
// //           email_subject: "You have a payout!",
// //           email_message: "You have received a payout from Aviator Game"
// //         },
// //         items: [{
// //           recipient_type: "EMAIL",
// //           amount: {
// //             value: amount.toString(),
// //             currency: "USD"
// //           },
// //           receiver: user.paypalEmail,
// //           note: "Thank you for playing Aviator!"
// //         }]
// //       });

// //       const response = await this.client.execute(request);
// //       return response.result.batch_header.payout_batch_id;
// //     } catch (error) {
// //       throw new PaymentError('Failed to process payout', error);
// //     }
// //   }
// // }


// import { PayPalHttpClient, Environment } from '@paypal/checkout-server-sdk';
// import { PayoutsPostRequest } from '@paypal/checkout-server-sdk';
// import { eq, and } from 'drizzle-orm';
// import { randomUUID } from 'crypto';
// import { db } from '../db/database';
// import { users, transactions } from '../models/schema';
// import type { InferSelectModel } from 'drizzle-orm';
// import dotenv from 'dotenv';
// dotenv.config();
// // Define types based on your schema
// type User = InferSelectModel<typeof users>;
// type Transaction = InferSelectModel<typeof transactions>;

// export class PayoutService {
//   private static instance: PayoutService;
//   private client: PayPalHttpClient;

//   private constructor() {
//     const clientId = process.env.PAYPAL_CLIENT_ID;
//     const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

//     if (!clientId || !clientSecret) {
//       throw new Error('PayPal credentials not configured');
//     }

//     const environment = process.env.NODE_ENV === 'production'
//       ? new Environment.LiveEnvironment(clientId, clientSecret)
//       : new Environment.SandboxEnvironment(clientId, clientSecret);

//     this.client = new PayPalHttpClient(environment);
//   }

//   public static getInstance(): PayoutService {
//     if (!PayoutService.instance) {
//       PayoutService.instance = new PayoutService();
//     }
//     return PayoutService.instance;
//   }

//   async processPayout(userId: string, amount: number): Promise<string> {
//     // Input validation
//     if (amount <= 0) {
//       throw new Error('Invalid payout amount');
//     }

//     // Find user with proper type inference
//     const user = await db.select()
//       .from(users)
//       .where(eq(users.id, userId))
//       .get();

//     if (!user) {
//       throw new Error('User not found');
//     }

//     if (user.status !== 'active') {
//       throw new Error('User account is not active');
//     }

//     if (user.balance < amount) {
//       throw new Error('Insufficient balance');
//     }

//     // Create transaction record
//     const transactionId = randomUUID();
//     const transaction: Omit<Transaction, 'createdAt'> = {
//       id: transactionId,
//       userId,
//       type: 'withdrawal',
//       amount: -amount,
//       status: 'pending'
//     };

//     // Begin transaction process
//     try {
//       // Insert transaction record
//       await db.insert(transactions)
//         .values(transaction);

//       // Create PayPal payout request
//       const request = new PayoutsPostRequest();
//       request.requestBody({
//         sender_batch_header: {
//           sender_batch_id: transactionId,
//           email_subject: "Your Aviator Game Payout",
//           email_message: "You have received a payout from Aviator Game"
//         },
//         items: [{
//           recipient_type: "EMAIL",
//           amount: {
//             value: amount.toFixed(2),
//             currency: "USD"
//           },
//           receiver: user.email,
//           note: "Thanks for playing!"
//         }]
//       });

//       // Execute PayPal payout
//       const response = await this.client.execute(request);

//       // Update database records atomically
//       await db.transaction(async (tx) => {
//         // Update transaction status
//         await tx.update(transactions)
//           .set({ status: 'completed' })
//           .where(eq(transactions.id, transactionId));

//         // Update user balance
//         await tx.update(users)
//           .set({ balance: user.balance - amount })
//           .where(eq(users.id, userId));
//       });

//       return response.result.batch_header.payout_batch_id;

//     } catch (error) {
//       // Log the error for debugging
//       console.error('Payout processing failed:', error);

//       // Mark transaction as failed
//       await db.update(transactions)
//         .set({ status: 'failed' })
//         .where(eq(transactions.id, transactionId));

//       throw new Error('Payout processing failed');
//     }
//   }

//   async getPayoutHistory(userId: string): Promise<Transaction[]> {
//     return db.select()
//       .from(transactions)
//       .where(and(eq(transactions.userId, userId), eq(transactions.type, 'withdrawal')))
//       .all();
//   }
// }
