// import { WebSocket, WebSocketServer } from 'ws';
// import { setTimeout } from 'timers';
// type Timeout = ReturnType<typeof setTimeout>;
// import { RedisClientType } from 'redis';
// import { randomBytes } from 'crypto';
// import { db } from '../db/database';
// import { bets, transactions, users } from '../models/schema';
// import { createMessage } from '../utils/websocket.utils';
// import { GameState, GameResult ,GameBalance,GameParticipant,Bet } from '../interfaces/interface';
// import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
// import { InferSelectModel } from 'drizzle-orm';
// type User = InferSelectModel<typeof users>;
// type Transaction = InferSelectModel<typeof transactions>;


// export class GameService {
//   private static instance: GameService;
//   private gameState!: GameState; // Using definite assignment assertion
//   private readonly BETTING_PHASE_DURATION = 10000;
//   private readonly MIN_BET_AMOUNT = 10;
//   private readonly MAX_BET_AMOUNT = 20000;
//   private gameLoop: Timeout | null = null;
//   // private gameLoop: NodeJS.Timer | null = null;
//   private wss: WebSocketServer;
//   private isGameRunning: boolean = false;
//   private readonly BASE_GROWTH_RATE = 0.1;
//   private gameBalances: Map<string, number> = new Map();


//   private constructor(
//     private redisClient: RedisClientType,
//     wss: WebSocketServer
//   ) {
//     this.wss = wss;
//     this.initializeGame();
//     this.startContinuousGame();
//   }

//     private initializeGame() {
//     this.gameState = {
//       status: 'betting',
//       currentMultiplier: 1.0,
//       crashPoint: this.generateCrashPoint(),
//       roundId: crypto.randomUUID(),
//       participants: new Map(),
//       startTime: new Date(),
//       roundHistory: []
//     };
//   }

//   static getInstance(redisClient: RedisClientType, wss: WebSocketServer) {
//     if (!GameService.instance) {
//       GameService.instance = new GameService(redisClient, wss);
//     }
//     return GameService.instance;
//   }

//   private async getGameBalance(userId: string): Promise<number> {
//     if (!this.gameBalances.has(userId)) {
//       // Initialize from database if not in memory
//       const user = await db.select()
//         .from(users)
//         .where(eq(users.id, userId))
//         .get();
//       this.gameBalances.set(userId, user?.balance || 0);
//     }
//     return this.gameBalances.get(userId) || 0;
//   }

//   // Update game balance in memory
//   private updateGameBalance(userId: string, amount: number) {
//     const currentBalance = this.gameBalances.get(userId) || 0;
//     this.gameBalances.set(userId, currentBalance + amount);
//   }

//    // Transfer from game balance to main account
//   public async transferToMainAccount(userId: string, amount: number) {
//     const gameBalance = await this.getGameBalance(userId);
//     if (gameBalance < amount) {
//       throw new Error('Insufficient game balance');
//     }

//     await db.transaction(async (tx) => {
//       // Deduct from game balance
//       this.updateGameBalance(userId, -amount);

//       // Add to main account balance
//       await tx.update(users)
//         .set({ balance: sql`balance + ${amount}` })
//         .where(eq(users.id, userId));

//       // Record transaction
//       await tx.insert(transactions).values({
//         id: crypto.randomUUID(),
//         userId,
//         type: 'withdrawal',
//         amount,
//         status: 'completed',
//         createdAt: new Date()
//       });
//     });
//   }

//   private generateCrashPoint(): number {
//     const e = 2 ** 32;
//     const h = randomBytes(4).readUInt32BE(0);
//     return Math.max(1.0, (100 * e - h) / (e - h)) / 100;
//   }

//    private async startContinuousGame() {
//     if (this.isGameRunning) {
//       console.log('Game is already running');
//       return;
//     }

//     this.isGameRunning = true;
//     console.log('Starting continuous game rounds');

//     const runGameRound = async () => {
//       try {
//         // Initialize new round
//         this.initializeGame();
//         console.log(`Starting new round ${this.gameState.roundId} with crash point ${this.gameState.crashPoint}`);

//         // Store round info in Redis
//         await this.redisClient.set(
//           `game:${this.gameState.roundId}`,
//           JSON.stringify({
//             status: this.gameState.status,
//             roundId: this.gameState.roundId,
//             startTime: this.gameState.startTime
//           }),
//           { EX: 3600 }
//         );

//         // Broadcast round start
//         this.broadcast('game:round_start', {
//           roundId: this.gameState.roundId,
//           startTime: this.gameState.startTime,
//           bettingPhase: true
//         });

//         // Betting phase
//         await new Promise(resolve => setTimeout(resolve, this.BETTING_PHASE_DURATION));

//         // Start flight phase
//         this.gameState.status = 'flying';
//         this.broadcast('game:flight_start', {
//           startTime: new Date()
//         });

//         // Run multiplier updates
//         let lastUpdateTime = Date.now();
//         return new Promise<void>((resolve) => {
//           this.gameLoop = setInterval(() => {
//             const currentTime = Date.now();
//             const deltaTime = (currentTime - lastUpdateTime) / 1000;
//             lastUpdateTime = currentTime;

//             this.gameState.currentMultiplier *= (1 + this.BASE_GROWTH_RATE * deltaTime);

//             if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
//               if (this.gameLoop) {
//                 clearInterval(this.gameLoop);
//                 this.gameLoop = null;
//               }
//               resolve();
//               return;
//             }

//             this.processAutoCashouts();
//             this.broadcast('game:multiplier', {
//               multiplier: this.gameState.currentMultiplier.toFixed(2),
//               timestamp: new Date()
//             });
//           }, 50); // Update every 50ms
//         });
//       } catch (error) {
//         console.error('Error in game round:', error);
//       }
//     };

//     // Continuous game loop
//     while (this.isGameRunning) {
//       try {
//         await runGameRound();
//         await this.handleCrash();
//         // Short delay between rounds
//         await new Promise(resolve => setTimeout(resolve, 3000));
//       } catch (error) {
//         console.error('Error in continuous game loop:', error);
//         // Add small delay before retrying
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
//   }

//   private processAutoCashouts() {
//     this.gameState.participants.forEach((participant, playerId) => {
//       if (
//         participant.betStatus === 'active' &&
//         participant.autoMode?.enabled &&
//         this.gameState.currentMultiplier >= participant.autoMode.targetMultiplier
//       ) {
//         this.handleCashout(playerId);
//       }
//     });
//   }
//   // private startGameLoop() {
//   //   let lastUpdateTime = Date.now();

//   //   this.gameLoop = setInterval(() => {
//   //     const currentTime = Date.now();
//   //     const deltaTime = (currentTime - lastUpdateTime) / 1000;
//   //     lastUpdateTime = currentTime;

//   //     this.gameState.currentMultiplier *= (1 + this.BASE_GROWTH_RATE * deltaTime);

//   //     if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
//   //       this.handleCrash();
//   //       return;
//   //     }

//   //     this.processAutoCashouts();
//   //     this.broadcast('game:multiplier', {
//   //       multiplier: this.gameState.currentMultiplier,
//   //       timestamp: new Date()
//   //     });
//   //   }, 50);
//   // }

//   // processAutoCashouts() {
//   //   this.gameState.participants.forEach((bet, playerId) => {
//   //     if (bet.status === 'active' && bet.autoMode?.enabled) {
//   //       if (this.gameState.currentMultiplier >= bet.autoMode.targetMultiplier) {
//   //         this.handleCashout(playerId);
//   //       }
//   //     }
//   //   });
//   // }


//   // async handleCashout(playerId: string): Promise<{ currentMultiplier: number; payout: number } | void> {
//   //   const bet = this.gameState.participants.get(playerId);
//   //   if (!bet || bet.status !== 'active') {
//   //     return;
//   //   }
//   //     const user = await db.select()
//   //         .from(users)
//   //         .where(eq(users.id, playerId))
//   //         .get();

//   //   if (!user) {
//   //     return;
//   //   }

//   //   bet.status = 'won';
//   //   bet.cashoutMultiplier = this.gameState.currentMultiplier;
//   //   const payout = bet.amount * bet.cashoutMultiplier;

//   //   db.transaction(async (tx) => {
//   //     await tx.update(bets)
//   //       .set({
//   //         status: bet.status,
//   //         cashoutMultiplier: bet.cashoutMultiplier
//   //       })
//   //       .where(eq(bets.id, bet.id));

//   //     await tx.update(users)
//   //       .set({ balance: user.balance + payout })
//   //       .where(eq(users.id, playerId));
//   //   });

//   //   this.broadcast('game:cashout', {
//   //     playerId,
//   //     multiplier: bet.cashoutMultiplier,
//   //     payout,
//   //     betId: bet.id

//   //   });

//   //   return {
//   //     currentMultiplier: bet.cashoutMultiplier,
//   //     payout
//   //   };
//   // }

//     private async handleCashout(playerId: string): Promise<void> {
//     const participant = this.gameState.participants.get(playerId);
//     if (!participant || participant.betStatus !== 'active') {
//       return;
//     }

//     const winAmount = participant.betAmount * this.gameState.currentMultiplier;
//     participant.betStatus = 'cashed_out';
//     participant.cashoutMultiplier = this.gameState.currentMultiplier;
//     participant.winAmount = winAmount;

//     // Update game balance immediately
//     this.updateGameBalance(playerId, winAmount);

//     // Record in round history
//     this.gameState.roundHistory.push({
//       playerId,
//       username: participant.username,
//       cashoutMultiplier: this.gameState.currentMultiplier,
//       betAmount: participant.betAmount,
//       winAmount,
//       timestamp: new Date()
//     });

//     // Broadcast cashout
//     this.broadcast('game:cashout', {
//       playerId,
//       username: participant.username,
//       multiplier: this.gameState.currentMultiplier,
//       betAmount: participant.betAmount,
//       winAmount,
//       timestamp: new Date()
//     });
//   }

//   // private async handleCrash() {
//   //   this.gameState.status = 'crashed';
//   //   this.gameState.endTime = new Date();

//   //   // Process game results
//   //   const gameResult = await this.processGameResults();

//   //   // Store game result in Redis
//   //   await this.redisClient.set(
//   //     `game:result:${this.gameState.roundId}`,
//   //     JSON.stringify(gameResult),
//   //     { EX: 86400 }
//   //   );

//   //   // Broadcast crash
//   //   this.broadcast('game:crash', {
//   //     finalMultiplier: this.gameState.crashPoint,
//   //     timestamp: this.gameState.endTime,
//   //     results: gameResult
//   //   });
//   // }

//    private async handleCrash() {
//     this.gameState.status = 'crashed';
//     this.gameState.endTime = new Date();

//     // Mark remaining active bets as lost
//     this.gameState.participants.forEach((participant) => {
//       if (participant.betStatus === 'active') {
//         participant.betStatus = 'lost';
//       }
//     });

//     // Broadcast crash with detailed results
//     this.broadcast('game:crash', {
//       crashPoint: this.gameState.crashPoint,
//       timestamp: this.gameState.endTime,
//       roundHistory: this.gameState.roundHistory,
//       finalResults: Array.from(this.gameState.participants.values()).map(p => ({
//         username: p.username,
//         betAmount: p.betAmount,
//         status: p.betStatus,
//         cashoutMultiplier: p.cashoutMultiplier,
//         winAmount: p.winAmount
//       }))
//     });
//   }

//   // private async processGameResults(): Promise<GameResult> {
//   //   const results: GameResult = {
//   //     roundId: this.gameState.roundId,
//   //     crashPoint: this.gameState.crashPoint,
//   //     startTime: this.gameState.startTime!,
//   //     endTime: this.gameState.endTime!,
//   //     participants: this.gameState.participants
//   //   };

//   //   // Process all bets
//   //   for (const [playerId, bet] of this.gameState.participants) {
//   //     if (bet.status === 'active') {
//   //       bet.status = 'lost';

//   //       // Record loss transaction
//   //       await db.insert(transactions).values({
//   //         id: crypto.randomUUID(),
//   //         userId: playerId,
//   //         type: 'bet',
//   //         amount: -bet.betAmount,
//   //         status: 'completed',
//   //         createdAt: new Date()
//   //       });
//   //     }
//   //   }

//   //   return results;
//   // }

// //   public async placeBet(playerId: string, amount: number, autoMode?: { enabled: boolean; targetMultiplier: number }) {
// //     // Validate bet
// //     if (this.gameState.status !== 'betting') {
// //       throw new Error('Betting phase is closed');
// //     }

// //     if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
// //       throw new Error(`Bet amount must be between ${this.MIN_BET_AMOUNT} and ${this.MAX_BET_AMOUNT}`);
// //     }

// //     // Check user balance
// //  const user = await db.select()
// //        .from(users)
// //        .where(eq(users.id, playerId))
// //       .get();



// //     if (!user || user.balance < amount) {
// //       throw new Error('Insufficient balance');
// //     }

// //     // Create bet
// //     const bet: Bet = {
// //       id: crypto.randomUUID(),
// //       playerId,
// //       amount,
// //       placedAt: new Date(),
// //       status: 'active',
// //       autoMode
// //     };

// //     // Update database
// //     await db.transaction(async (tx) => {
// //       await tx.insert(bets).values({
// //         id: bet.id,
// //         playerId: bet.playerId,
// //         amount: bet.amount,
// //         placedAt: bet.placedAt,
// //         status: bet.status,
// //         autoMode: bet.autoMode ? bet.autoMode : null
// //       });

// //       await tx.update(users)
// //         .set({ balance: user.balance - amount })
// //         .where(eq(users.id, playerId));
// //     });

// //     // Update game state
// //     this.gameState.participants.set(playerId, bet);

// //     // Broadcast bet
// //     this.broadcast('game:bet', {
// //       playerId,
// //       amount,
// //       betId: bet.id
// //     });

// //     return bet;
//   //   }

//    public async placeBet(playerId: string, amount: number, autoMode?: { enabled: boolean; targetMultiplier: number }) {
//     if (this.gameState.status !== 'betting') {
//       throw new Error('Betting phase is closed');
//     }

//     const gameBalance = await this.getGameBalance(playerId);
//     if (gameBalance < amount) {
//       throw new Error('Insufficient game balance');
//     }

//     const user = await db.select()
//       .from(users)
//       .where(eq(users.id, playerId))
//       .get();

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Create participant entry
//     const participant: GameParticipant = {
//       id: playerId,
//       username: user.username,
//       betAmount: amount,
//       betStatus: 'active',
//       autoMode
//     };

//     // Update game balance
//     this.updateGameBalance(playerId, -amount);
//     this.gameState.participants.set(playerId, participant);

//     // Broadcast new participant
//     this.broadcast('game:new_participant', {
//       playerId,
//       username: user.username,
//       betAmount: amount
//     });

//     return participant;
//   }

//   private broadcast(type: string, data: any) {
//     const message = createMessage(type, data);
//     this.wss.clients.forEach((client: WebSocket) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(message);
//       }
//     });
//   }

//     /**
//    * Get the current state of the game
//    */
//   public async getCurrentState(): Promise<GameState> {
//     // Get cached state from Redis if available
//     const cachedState = await this.redisClient.get(`game:${this.gameState.roundId}`);
//     if (cachedState) {
//       return {
//         ...JSON.parse(cachedState),
//         participants: this.gameState.participants // Use in-memory participants map
//       };
//     }

//     return {
//       status: this.gameState.status,
//       currentMultiplier: this.gameState.currentMultiplier,
//       crashPoint: this.gameState.crashPoint,
//       roundId: this.gameState.roundId,
//       startTime: this.gameState.startTime,
//       endTime: this.gameState.endTime,
//       participants: this.gameState.participants,
//       roundHistory: this.gameState.roundHistory
//     };
//   }

//   // /**
//   //  * Place a bet for a user
//   //  */
//   // public async placeBet(
//   //   userId: string,
//   //   amount: number,
//   //   autoMode?: { enabled: boolean; targetMultiplier: number }
//   // ): Promise<Bet> {
//   //   // Validate game state
//   //   if (this.gameState.status !== 'betting') {
//   //     throw new Error('Betting phase is closed');
//   //   }

//   //   if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
//   //     throw new Error(`Bet amount must be between ${this.MIN_BET_AMOUNT} and ${this.MAX_BET_AMOUNT}`);
//   //   }

//   //   // Get user and check balance
//   //   const user = await db.select()
//   //     .from(users)
//   //     .where(eq(users.id, userId))
//   //     .get();

//   //   if (!user || user.balance < amount) {
//   //     throw new Error('Insufficient balance');
//   //   }

//   //   // Create new bet
//   //   const bet: Bet = {
//   //     id: crypto.randomUUID(),
//   //     playerId: userId,
//   //     amount,
//   //     placedAt: new Date(),
//   //     status: 'active',
//   //     autoMode
//   //   };

//   //   // Update database in transaction
//   //   await db.transaction(async (tx) => {
//   //     // Insert bet record
//   //     await tx.insert(bets).values({
//   //       id: bet.id,
//   //       playerId: bet.playerId,
//   //       amount: bet.amount,
//   //       placedAt: bet.placedAt,
//   //       status: bet.status,
//   //       autoMode: autoMode ? JSON.stringify(autoMode) : null
//   //     });

//   //     // Update user balance
//   //     await tx.update(users)
//   //       .set({ balance: user.balance - amount })
//   //       .where(eq(users.id, userId));
//   //   });

//   //   // Update game state
//   //   this.gameState.participants.set(userId, bet);

//   //   return bet;
//   // }

//   // /**
//   //  * Handle user cashout
//   //  */
//   // public async handleCashout(userId: string): Promise<{ multiplier: number; payout: number } | null> {
//   //   const bet = this.gameState.participants.get(userId);
//   //   if (!bet || bet.status !== 'active') {
//   //     throw new Error('No active bet found');
//   //   }

//   //   if (this.gameState.status !== 'flying') {
//   //     throw new Error('Game not in flight phase');
//   //   }

//   //   const user = await db.select()
//   //     .from(users)
//   //     .where(eq(users.id, userId))
//   //     .get();

//   //   if (!user) {
//   //     throw new Error('User not found');
//   //   }

//   //   // Calculate payout
//   //   bet.status = 'won';
//   //   bet.cashoutMultiplier = this.gameState.currentMultiplier;
//   //   const payout = bet.amount * bet.cashoutMultiplier;

//   //   // Update database
//   //   await db.transaction(async (tx) => {
//   //     // Update bet record
//   //     await tx.update(bets)
//   //       .set({
//   //         status: bet.status,
//   //         cashoutMultiplier: bet.cashoutMultiplier
//   //       })
//   //       .where(eq(bets.id, bet.id));

//   //     // Update user balance
//   //     await tx.update(users)
//   //       .set({ balance: user.balance + payout })
//   //       .where(eq(users.id, userId));

//   //     // Record transaction
//   //     await tx.insert(transactions).values({
//   //       id: crypto.randomUUID(),
//   //       userId: userId,
//   //       type: 'win',
//   //       amount: payout,
//   //       status: 'completed',
//   //       createdAt: new Date()
//   //     });
//   //   });

//   //   return {
//   //     multiplier: bet.cashoutMultiplier,
//   //     payout
//   //   };
//   // }

//   /**
//    * Handle user disconnect
//    */

//   public async handleDisconnect(userId: string): Promise<void> {
//     const participant = this.gameState.participants.get(userId);

//     // If user has an active bet during crash, mark it as lost
//     if (participant && participant.betStatus === 'active' && this.gameState.status === 'crashed') {
//       participant.betStatus = 'lost';

//       await db.update(bets)
//         .set({ status: 'lost' })
//         .where(eq(bets.id, participant.id));

//       // Record loss transaction
//       await db.insert(transactions).values({
//         id: crypto.randomUUID(),
//         userId: userId,
//         type: 'bet',
//         amount: -participant.betAmount,
//         status: 'completed',
//         createdAt: new Date()
//       });
//     }

//     // Could add additional cleanup here if needed
//     await this.redisClient.del(`user:${userId}:session`);
//   }
// }

// import { SQL, sql } from 'drizzle-orm';

// function eq(column: SQLiteColumn, value: string): SQL {
//   return sql`${column} = ${value}`;
// }


import { WebSocket, WebSocketServer } from 'ws';
import { setTimeout } from 'timers';
type Timeout = ReturnType<typeof setTimeout>;
import { RedisClientType } from 'redis';
import { randomBytes } from 'crypto';
import { db } from '../db/database';
import { bets, transactions, users } from '../models/schema';
import { createMessage } from '../utils/websocket.utils';
import { GameState, GameResult, GameBalance, GameParticipant, Bet } from '../interfaces/interface';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { InferSelectModel } from 'drizzle-orm';
type User = InferSelectModel<typeof users>;
type Transaction = InferSelectModel<typeof transactions>;

export class GameService {
  private static instance: GameService;
  private gameState!: GameState;
  private readonly BETTING_PHASE_DURATION = 10000;
  private readonly MIN_BET_AMOUNT = 10;
  private readonly MAX_BET_AMOUNT = 20000;
  private gameLoop: Timeout | null = null;
  private wss: WebSocketServer;
  private isGameRunning: boolean = false;
  private readonly BASE_GROWTH_RATE = 0.1;
  private gameBalances: Map<string, number> = new Map();

  private constructor(
    private redisClient: RedisClientType,
    wss: WebSocketServer
  ) {
    console.log('🎮 Initializing GameService...');
    this.wss = wss;
    this.initializeGame();
    this.startContinuousGame();
  }

  private initializeGame() {
    const crashPoint = this.generateCrashPoint();
    console.log('🎲 Initializing new game round:');
    this.gameState = {
      status: 'betting',
      currentMultiplier: 1.0,
      crashPoint,
      roundId: crypto.randomUUID(),
      participants: new Map(),
      startTime: new Date(),
      roundHistory: []
    };
    console.log(`   📍 Round ID: ${this.gameState.roundId}`);
    console.log(`   💥 Crash Point: ${crashPoint}x`);
    console.log(`   🕒 Start Time: ${this.gameState.startTime}`);
  }

  static getInstance(redisClient: RedisClientType, wss: WebSocketServer) {
    if (!GameService.instance) {
      console.log('📦 Creating new GameService instance');
      GameService.instance = new GameService(redisClient, wss);
    }
    return GameService.instance;
  }

  private async getGameBalance(userId: string): Promise<number> {
    if (!this.gameBalances.has(userId)) {
      console.log(`💰 Initializing game balance for user ${userId}`);
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .get();
      this.gameBalances.set(userId, user?.balance || 0);
    }
    const balance = this.gameBalances.get(userId) || 0;
    console.log(`💳 Current game balance for user ${userId}: ${balance}`);
    return balance;
  }

  private updateGameBalance(userId: string, amount: number) {
    const currentBalance = this.gameBalances.get(userId) || 0;
    const newBalance = currentBalance + amount;
    console.log(`💰 Updating balance for user ${userId}:`);
    console.log(`   Previous: ${currentBalance}`);
    console.log(`   Change: ${amount > 0 ? '+' : ''}${amount}`);
    console.log(`   New: ${newBalance}`);
    this.gameBalances.set(userId, newBalance);
  }

  public async transferToMainAccount(userId: string, amount: number) {
    console.log(`🔄 Transfer request - User: ${userId}, Amount: ${amount}`);
    const gameBalance = await this.getGameBalance(userId);
    if (gameBalance < amount) {
      console.error(`❌ Insufficient game balance for user ${userId}`);
      throw new Error('Insufficient game balance');
    }

    await db.transaction(async (tx) => {
      console.log('📝 Starting transfer transaction...');
      this.updateGameBalance(userId, -amount);

      await tx.update(users)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(users.id, userId));

      const transactionId = crypto.randomUUID();
      await tx.insert(transactions).values({
        id: transactionId,
        userId,
        type: 'withdrawal',
        amount,
        status: 'completed',
        createdAt: new Date()
      });
      console.log(`✅ Transfer completed - Transaction ID: ${transactionId}`);
    });
  }

  private generateCrashPoint(): number {
    const e = 2 ** 32;
    const h = randomBytes(4).readUInt32BE(0);
    const crashPoint = Math.max(1.0, (100 * e - h) / (e - h)) / 100;
    console.log(`🎯 Generated crash point: ${crashPoint}x`);
    return crashPoint;
  }

  private async startContinuousGame() {
    if (this.isGameRunning) {
      console.log('⚠️ Game is already running');
      return;
    }

    this.isGameRunning = true;
    console.log('🎮 Starting continuous game rounds');

    const runGameRound = async () => {
      try {
        this.initializeGame();
        console.log(`🚀 New round ${this.gameState.roundId} starting`);

        await this.redisClient.set(
          `game:${this.gameState.roundId}`,
          JSON.stringify({
            status: this.gameState.status,
            roundId: this.gameState.roundId,
            startTime: this.gameState.startTime
          }),
          { EX: 3600 }
        );

        this.broadcast('game:round_start', {
          roundId: this.gameState.roundId,
          startTime: this.gameState.startTime,
          bettingPhase: true
        });

        console.log(`⏳ Betting phase started - Duration: ${this.BETTING_PHASE_DURATION}ms`);
        await new Promise(resolve => setTimeout(resolve, this.BETTING_PHASE_DURATION));

        this.gameState.status = 'flying';
        console.log('🛫 Flight phase started');
        this.broadcast('game:flight_start', {
          startTime: new Date()
        });

        let lastUpdateTime = Date.now();
        return new Promise<void>((resolve) => {
          this.gameLoop = setInterval(() => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastUpdateTime) / 1000;
            lastUpdateTime = currentTime;

            this.gameState.currentMultiplier *= (1 + this.BASE_GROWTH_RATE * deltaTime);

            if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
              console.log(`💥 Crash point reached at ${this.gameState.currentMultiplier}x`);
              if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
              }
              resolve();
              return;
            }

            this.processAutoCashouts();
            this.broadcast('game:multiplier', {
              multiplier: this.gameState.currentMultiplier.toFixed(2),
              timestamp: new Date()
            });
          }, 50);
        });
      } catch (error) {
        console.error('❌ Error in game round:', error);
      }
    };

    while (this.isGameRunning) {
      try {
        await runGameRound();
        await this.handleCrash();
        console.log('⏸️ Waiting for next round...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('❌ Error in continuous game loop:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private processAutoCashouts() {
    this.gameState.participants.forEach((participant, playerId) => {
      if (
        participant.betStatus === 'active' &&
        participant.autoMode?.enabled &&
        this.gameState.currentMultiplier >= participant.autoMode.targetMultiplier
      ) {
        console.log(`🤖 Auto cashout triggered for player ${playerId} at ${this.gameState.currentMultiplier}x`);
        this.handleCashout(playerId);
      }
    });
  }

  private async handleCashout(playerId: string): Promise<void> {
    const participant = this.gameState.participants.get(playerId);
    if (!participant || participant.betStatus !== 'active') {
      console.log(`❌ Invalid cashout attempt for player ${playerId}`);
      return;
    }

    const winAmount = participant.betAmount * this.gameState.currentMultiplier;
    participant.betStatus = 'cashed_out';
    participant.cashoutMultiplier = this.gameState.currentMultiplier;
    participant.winAmount = winAmount;

    console.log(`💰 Player ${playerId} cashed out:`);
    console.log(`   Bet Amount: ${participant.betAmount}`);
    console.log(`   Multiplier: ${this.gameState.currentMultiplier}x`);
    console.log(`   Win Amount: ${winAmount}`);

    this.updateGameBalance(playerId, winAmount);

    this.gameState.roundHistory.push({
      playerId,
      username: participant.username,
      cashoutMultiplier: this.gameState.currentMultiplier,
      betAmount: participant.betAmount,
      winAmount,
      timestamp: new Date()
    });

    this.broadcast('game:cashout', {
      playerId,
      username: participant.username,
      multiplier: this.gameState.currentMultiplier,
      betAmount: participant.betAmount,
      winAmount,
      timestamp: new Date()
    });
  }

  private async handleCrash() {
    this.gameState.status = 'crashed';
    this.gameState.endTime = new Date();
    console.log(`💥 Game crashed at ${this.gameState.crashPoint}x`);

    let activePlayers = 0;
    this.gameState.participants.forEach((participant) => {
      if (participant.betStatus === 'active') {
        participant.betStatus = 'lost';
        activePlayers++;
      }
    });
    console.log(`   ${activePlayers} players lost their bets`);

    this.broadcast('game:crash', {
      crashPoint: this.gameState.crashPoint,
      timestamp: this.gameState.endTime,
      roundHistory: this.gameState.roundHistory,
      finalResults: Array.from(this.gameState.participants.values()).map(p => ({
        username: p.username,
        betAmount: p.betAmount,
        status: p.betStatus,
        cashoutMultiplier: p.cashoutMultiplier,
        winAmount: p.winAmount
      }))
    });
  }

  public async placeBet(playerId: string, amount: number, autoMode?: { enabled: boolean; targetMultiplier: number }) {
    console.log(`🎲 New bet request:`);
    console.log(`   Player: ${playerId}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Auto Mode: ${autoMode ? 'Enabled' : 'Disabled'}`);

    if (this.gameState.status !== 'betting') {
      console.error('❌ Betting phase is closed');
      throw new Error('Betting phase is closed');
    }

    const gameBalance = await this.getGameBalance(playerId);
    if (gameBalance < amount) {
      console.error(`❌ Insufficient balance for player ${playerId}`);
      throw new Error('Insufficient game balance');
    }

    const user = await db.select()
      .from(users)
      .where(eq(users.id, playerId))
      .get();

    if (!user) {
      console.error(`❌ User ${playerId} not found`);
      throw new Error('User not found');
    }

    const participant: GameParticipant = {
      id: playerId,
      username: user.username,
      betAmount: amount,
      betStatus: 'active',
      autoMode
    };

    this.updateGameBalance(playerId, -amount);
    this.gameState.participants.set(playerId, participant);

    console.log(`✅ Bet placed successfully`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Bet Amount: ${amount}`);

    this.broadcast('game:new_participant', {
      playerId,
      username: user.username,
      betAmount: amount
    });

    return participant;
  }

  private broadcast(type: string, data: any) {
    const message = createMessage(type, data);
    console.log(`📢 Broadcasting ${type}:`, data);
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public async getCurrentState(): Promise<GameState> {
    console.log(`🔍 Getting current game state for round ${this.gameState.roundId}`);
    const cachedState = await this.redisClient.get(`game:${this.gameState.roundId}`);
    if (cachedState) {
      console.log('   📦 Using cached state from Redis');
      return {
        ...JSON.parse(cachedState),
        participants: this.gameState.participants
      };
    }

    console.log('   🔄 Using current memory state');
    return {
      status: this.gameState.status,
      currentMultiplier: this.gameState.currentMultiplier,
      crashPoint: this.gameState.crashPoint,
      roundId: this.gameState.roundId,
      startTime: this.gameState.startTime,
      endTime: this.gameState.endTime,
      participants: this.gameState.participants,
      roundHistory: this.gameState.roundHistory
    };
  }

  public async handleDisconnect(userId: string): Promise<void> {
    console.log(`👋 User ${userId} disconnected`);
    const participant = this.gameState.participants.get(userId);

    if (participant && participant.betStatus === 'active' && this.gameState.status === 'crashed') {
      console.log(`   ❌ Active bet marked as lost`);
      participant.betStatus = 'lost';

      await db.update(bets)
        .set({ status: 'lost' })
        .where(eq(bets.id, participant.id));

      const transactionId = crypto.randomUUID();
      await db.insert(transactions).values({
        id: transactionId,
        userId: userId,
        type: 'bet',
        amount: -participant.betAmount,
        status: 'completed',
        createdAt: new Date()
      });
      console.log(`   📝 Loss transaction recorded: ${transactionId}`);
    }

    await this.redisClient.del(`user:${userId}:session`);
    console.log(`   🔄 User session cleared`);
  }
}

import { SQL, sql } from 'drizzle-orm';

function eq(column: SQLiteColumn, value: string): SQL {
  console.log(`🔍 Creating SQL equality condition:`);
  console.log(`   Column: ${column.name}`);
  console.log(`   Value: ${value}`);
  return sql`${column} = ${value}`;
}

// Logging Legend:
// 🎮 Game Service related
// 💰 Balance/Transaction related
// 🎲 Betting related
// 🚀 Round/Game state related
// 💥 Crash related
// 👋 User/Connection related
// 📢 Broadcasting related
// ❌ Errors
// ✅ Success
// 🔍 Query/Search related
// 📝 Database operations
// ⏳ Time-related
// 🔄 Updates/Changes
// 📦 Cache/Storage related
// 🤖 Automated actions
