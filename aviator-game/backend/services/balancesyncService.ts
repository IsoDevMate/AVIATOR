// import { WebSocket } from 'ws';
// import { RedisClientType } from 'redis';
// import { db } from '../db/database';
// import { users } from '../models/schema';
// import { eq } from 'drizzle-orm';

// export class BalanceSyncService {
//   private static instance: BalanceSyncService;
//   private connectedClients: Map<string, WebSocket> = new Map();
//   private balanceCache: Map<string, number> = new Map();

//   private constructor(private redisClient: RedisClientType) {}

//   static getInstance(redisClient: RedisClientType) {
//     if (!BalanceSyncService.instance) {
//       BalanceSyncService.instance = new BalanceSyncService(redisClient);
//     }
//     return BalanceSyncService.instance;
//   }

//   async registerClient(userId: string, ws: WebSocket) {
//     this.connectedClients.set(userId, ws);
//     await this.syncBalance(userId);
//   }

//   removeClient(userId: string) {
//     this.connectedClients.delete(userId);
//     this.balanceCache.delete(userId);
//   }

//   private async getLatestBalance(userId: string): Promise<number> {
//     const user = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, userId))
//       .get();

//     return user?.balance || 0;
//   }

//   async syncBalance(userId: string) {
//     const latestBalance = await this.getLatestBalance(userId);
//     const cachedBalance = this.balanceCache.get(userId);

//     if (cachedBalance !== latestBalance) {
//       this.balanceCache.set(userId, latestBalance);
//       await this.notifyBalanceUpdate(userId, latestBalance);
//     }
//   }

//   private async notifyBalanceUpdate(userId: string, balance: number) {
//     const ws = this.connectedClients.get(userId);
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({
//         type: 'balance_update',
//         data: { balance }
//       }));
//     }

//     // Cache balance in Redis for quick access
//     await this.redisClient.set(
//       `user:${userId}:balance`,
//       balance.toString(),
//       { EX: 3600 } // 1 hour expiration
//     );
//   }

//   async updateBalance(userId: string, amount: number) {
//     await db.transaction(async (tx) => {
//       const updatedUser = await tx
//         .update(users)
//         .set({
//           balance: sql`balance + ${amount}`,
//           updatedAt: new Date()
//         })
//         .where(eq(users.id, userId))
//         .returning()
//         .get();

//       this.balanceCache.set(userId, updatedUser.balance);
//       await this.notifyBalanceUpdate(userId, updatedUser.balance);
//     });
//   }
// }
