// import { randomBytes } from 'crypto';
// import { GameState, Player, Bet } from '../interfaces/interface';
// import { WebSocket } from 'ws';
// import { Server } from 'socket.io';
// // import { RedisClient } from 'redis';
// import { LeaderboardService } from './leaderboard.service';
// import { StatisticsService } from './statistics.service';
// import { GameHistoryService } from './game-history.service';
// import { ChatService } from './chat.service';
// import { Result } from '../interfaces/result.interface';


// export class GameService {
//   private gameState: GameState;
//   private players: Map<string, Player>;
//   private readonly BETTING_PHASE_DURATION = 5000;
//   private readonly MIN_BET_AMOUNT = 10;
//   private readonly MAX_BET_AMOUNT = 20000;
//   private readonly BASE_GROWTH_RATE = 0.05;
//   private gameLoop: NodeJS.Timer | null = null;

//   constructor() {
//     constructor(
//     private io: Server,
//     private redisClient: RedisClient,
//     private leaderboardService: LeaderboardService,
//     private statisticsService: StatisticsService,
//     private gameHistoryService: GameHistoryService,
//     private chatService: ChatService
//   ) {

//     this.initializeGame();
//     this.players = new Map();
//   }

//   private initializeGame() {
//     this.gameState = {
//       status: 'betting',
//       currentMultiplier: 1.0,
//       crashPoint: this.generateCrashPoint(),
//       roundId: randomBytes(16).toString('hex'),
//       participants: new Map(),
//     };
//   }

//   // Provably fair crash point generation
//   private generateCrashPoint(): number {
//     const e = 2 ** 32;
//     const h = randomBytes(4).readUInt32BE(0);
//     return Math.max(1.0, (100 * e - h) / (e - h)) / 100;
//   }

//   public startGame() {
//     if (this.gameLoop) {
//       throw new Error('Game already running');
//     }

//     // Start betting phase
//     this.broadcastToAll({
//       type: 'ROUND_START',
//       data: {
//         roundId: this.gameState.roundId,
//         startTime: new Date(),
//         bettingPhase: true
//       }
//     });

//     // After betting phase, start flight
//     setTimeout(() => {
//       this.gameState.status = 'flying';
//       this.gameState.startTime = new Date();
//       this.startGameLoop();

//       this.broadcastToAll({
//         type: 'FLIGHT_START',
//         data: {
//           startTime: this.gameState.startTime
//         }
//       });
//     }, this.BETTING_PHASE_DURATION);
//   }

//   private startGameLoop() {
//     let lastUpdateTime = Date.now();

//     this.gameLoop = setInterval(() => {
//       const currentTime = Date.now();
//       const deltaTime = (currentTime - lastUpdateTime) / 1000;
//       lastUpdateTime = currentTime;

//       // Update multiplier using exponential growth
//       this.gameState.currentMultiplier *= (1 + this.BASE_GROWTH_RATE * deltaTime);

//       // Check for crash
//       if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
//         this.handleCrash();
//         return;
//       }

//       // Process auto-cashouts
//       this.processAutoCashouts();

//       // Broadcast current multiplier
//       this.broadcastToAll({
//         type: 'MULTIPLIER_UPDATE',
//         data: {
//           multiplier: this.gameState.currentMultiplier,
//           timestamp: new Date()
//         }
//       });
//     }, 50); // 20 updates per second
//   }

//   private handleCrash() {
//     if (this.gameLoop) {
//       clearInterval(this.gameLoop);
//       this.gameLoop = null;
//     }

//     this.gameState.status = 'crashed';
//     this.gameState.endTime = new Date();

//     // Process remaining bets as losses
//     const losers = Array.from(this.gameState.participants.values())
//       .filter(bet => bet.status === 'active')
//       .map(bet => {
//         bet.status = 'lost';
//         return bet;
//       });

//     // Broadcast crash event
//     this.broadcastToAll({
//       type: 'CRASH',
//       data: {
//         finalMultiplier: this.gameState.crashPoint,
//         timestamp: this.gameState.endTime,
//         losers: losers.map(bet => ({
//           playerId: bet.playerId,
//           amount: bet.amount
//         }))
//       }
//     });

//     // Start new round after delay
//     setTimeout(() => {
//       this.initializeGame();
//       this.startGame();
//     }, 3000);
//   }

//   private processAutoCashouts() {
//     this.gameState.participants.forEach((bet, playerId) => {
//       if (bet.status === 'active' && bet.autoMode?.enabled) {
//         if (this.gameState.currentMultiplier >= bet.autoMode.targetMultiplier) {
//           this.handleCashout(playerId);
//         }
//       }
//     });
//   }

//   public placeBet(playerId: string, amount: number, autoMode?: { enabled: boolean, targetMultiplier: number }): Result<Bet, string> {
//     // Validation checks
//     if (this.gameState.status !== 'betting') {
//       return { error: 'Betting phase is closed' };
//     }

//     if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
//       return { error: `Bet amount must be between ${this.MIN_BET_AMOUNT} and ${this.MAX_BET_AMOUNT}` };
//     }

//     const player = this.players.get(playerId);
//     if (!player) {
//       return { error: 'Player not found' };
//     }

//     if (player.balance < amount) {
//       return { error: 'Insufficient balance' };
//     }

//     // Create bet
//     const bet: Bet = {
//       id: randomBytes(16).toString('hex'),
//       playerId,
//       amount,
//       placedAt: new Date(),
//       status: 'active',
//       autoMode
//     };

//     // Update player state
//     player.balance -= amount;
//     player.activeBets.push(bet);
//     this.gameState.participants.set(playerId, bet);

//     // Broadcast bet placement
//     this.broadcastToAll({
//       type: 'BET_PLACED',
//       data: {
//         playerId,
//         amount,
//         betId: bet.id
//       }
//     });

//     return { data: bet };
//   }

//   public handleCashout(playerId: string): Result<{ multiplier: number, payout: number }, string> {
//     const bet = this.gameState.participants.get(playerId);
//     if (!bet || bet.status !== 'active') {
//       return { error: 'No active bet found' };
//     }

//     if (this.gameState.status !== 'flying') {
//       return { error: 'Game not in flight phase' };
//     }

//     const player = this.players.get(playerId);
//     if (!player) {
//       return { error: 'Player not found' };
//     }

//     // Process cashout
//     bet.status = 'won';
//     bet.cashoutMultiplier = this.gameState.currentMultiplier;
//     const payout = bet.amount * bet.cashoutMultiplier;
//     player.balance += payout;

//     // Broadcast cashout
//     this.broadcastToAll({
//       type: 'CASHOUT',
//       data: {
//         playerId,
//         multiplier: bet.cashoutMultiplier,
//         payout,
//         betId: bet.id
//       }
//     });

//     return {
//       data: {
//         multiplier: bet.cashoutMultiplier,
//         payout
//       }
//     };
//   }


//   private broadcastToAll(message: any) {
//     this.players.forEach(player => {
//       if (player.ws.readyState === WebSocket.OPEN) {
//         player.ws.send(JSON.stringify(message));
//       }
//     });
//   }


//   private async endGame() {
//     this.currentGame.status = 'crashed';

//     const gameResult: GameResult = {
//       crashPoint: this.currentGame.crashPoint,
//       totalBets: Array.from(this.currentGame.players.values())
//         .reduce((sum, p) => sum + p.betAmount, 0),
//       players: this.currentGame.players,
//       timestamp: Date.now(),
//       gameHash: this.currentGame.gameHash
//     };

//     // Process all player results
//     for (const [playerId, playerData] of this.currentGame.players) {
//       if (playerData.cashedOut) {
//         const winAmount = playerData.betAmount * playerData.cashOutMultiplier!;

//         // Update leaderboard
//         await this.leaderboardService.updateLeaderboard(
//           playerId,
//           playerData.cashOutMultiplier!,
//           winAmount
//         );

//         // Update statistics
//         await this.statisticsService.updateUserStats(playerId, {
//           won: true,
//           betAmount: playerData.betAmount,
//           winAmount,
//           multiplier: playerData.cashOutMultiplier!
//         });
//       } else {
//         // Update statistics for loss
//         await this.statisticsService.updateUserStats(playerId, {
//           won: false,
//           betAmount: playerData.betAmount,
//           winAmount: 0,
//           multiplier: 0
//         });
//       }
//     }

//     // Record game history
//     await this.gameHistoryService.recordGameResult(gameResult);

//     // Broadcast crash
//     this.io.emit('gameCrashed', gameResult);

//     // Start new game after delay
//     setTimeout(() => this.startNewGame(), 5000);
//   }
// }
// }

import { WebSocket, WebSocketServer } from 'ws';
import { RedisClientType } from 'redis';
import { randomBytes } from 'crypto';
import { db } from '../db/database';
import { bets, transactions, users } from '../models/schema';
import { createMessage } from '../utils/websocket.utils';
import { GameState, Bet, GameResult } from '../interfaces/interface';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { InferSelectModel } from 'drizzle-orm';
type User = InferSelectModel<typeof users>;
type Transaction = InferSelectModel<typeof transactions>;


export class GameService {
  private static instance: GameService;
  private gameState!: GameState; // Using definite assignment assertion
  private readonly BETTING_PHASE_DURATION = 5000;
  private readonly MIN_BET_AMOUNT = 10;
  private readonly MAX_BET_AMOUNT = 20000;
  private readonly BASE_GROWTH_RATE = 0.05;
  private gameLoop: NodeJS.Timer | null = null;
  private wss: WebSocketServer;

  private constructor(
    private redisClient: RedisClientType,
    wss: WebSocketServer
  ) {
    this.wss = wss;
    this.initializeGame();
  }

  private initializeGame() {
    this.gameState = {
      status: 'betting',
      currentMultiplier: 1.0,
      crashPoint: this.generateCrashPoint(),
      roundId: crypto.randomUUID(),
      participants: new Map()
    };
  }

  static getInstance(redisClient: RedisClientType, wss: WebSocketServer) {
    if (!GameService.instance) {
      GameService.instance = new GameService(redisClient, wss);
    }
    return GameService.instance;
  }



  private generateCrashPoint(): number {
    const e = 2 ** 32;
    const h = randomBytes(4).readUInt32BE(0);
    return Math.max(1.0, (100 * e - h) / (e - h)) / 100;
  }

  public async startGame() {
    if (this.gameLoop) {
      throw new Error('Game already running');
    }

    // Store initial game state in Redis
    await this.redisClient.set(
      `game:${this.gameState.roundId}`,
      JSON.stringify({
        status: this.gameState.status,
        roundId: this.gameState.roundId,
        startTime: new Date()
      }),
      { EX: 3600 }
    );

    // Broadcast round start
    this.broadcast('game:round_start', {
      roundId: this.gameState.roundId,
      startTime: new Date(),
      bettingPhase: true
    });

    // Start flight phase after betting period
    setTimeout(() => {
      this.gameState.status = 'flying';
      this.gameState.startTime = new Date();
      this.startGameLoop();

      this.broadcast('game:flight_start', {
        startTime: this.gameState.startTime
      });
    }, this.BETTING_PHASE_DURATION);
  }

  private startGameLoop() {
    let lastUpdateTime = Date.now();

    this.gameLoop = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastUpdateTime) / 1000;
      lastUpdateTime = currentTime;

      this.gameState.currentMultiplier *= (1 + this.BASE_GROWTH_RATE * deltaTime);

      if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
        this.handleCrash();
        return;
      }

      this.processAutoCashouts();
      this.broadcast('game:multiplier', {
        multiplier: this.gameState.currentMultiplier,
        timestamp: new Date()
      });
    }, 50);
  }
  processAutoCashouts() {
    this.gameState.participants.forEach((bet, playerId) => {
      if (bet.status === 'active' && bet.autoMode?.enabled) {
        if (this.gameState.currentMultiplier >= bet.autoMode.targetMultiplier) {
          this.handleCashout(playerId);
        }
      }
    });
  }
  async handleCashout(playerId: string): Promise<{ currentMultiplier: number; payout: number } | void> {
    const bet = this.gameState.participants.get(playerId);
    if (!bet || bet.status !== 'active') {
      return;
    }
      const user = await db.select()
          .from(users)
          .where(eq(users.id, playerId))
          .get();

    if (!user) {
      return;
    }

    bet.status = 'won';
    bet.cashoutMultiplier = this.gameState.currentMultiplier;
    const payout = bet.amount * bet.cashoutMultiplier;

    db.transaction(async (tx) => {
      await tx.update(bets)
        .set({
          status: bet.status,
          cashoutMultiplier: bet.cashoutMultiplier
        })
        .where(eq(bets.id, bet.id));

      await tx.update(users)
        .set({ balance: user.balance + payout })
        .where(eq(users.id, playerId));
    });

    this.broadcast('game:cashout', {
      playerId,
      multiplier: bet.cashoutMultiplier,
      payout,
      betId: bet.id

    });

    return {
      currentMultiplier: bet.cashoutMultiplier,
      payout
    };
  }

  private async handleCrash() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop as NodeJS.Timeout);
      this.gameLoop = null;
    }

    this.gameState.status = 'crashed';
    this.gameState.endTime = new Date();

    // Process game results
    const gameResult = await this.processGameResults();

    // Store game result in Redis
    await this.redisClient.set(
      `game:result:${this.gameState.roundId}`,
      JSON.stringify(gameResult),
      { EX: 86400 } // 24 hours
    );

    // Broadcast crash
    this.broadcast('game:crash', {
      finalMultiplier: this.gameState.crashPoint,
      timestamp: this.gameState.endTime,
      results: gameResult
    });

    // Start new round after delay
    setTimeout(() => {
      this.initializeGame();
      this.startGame();
    }, 3000);
  }

  private async processGameResults(): Promise<GameResult> {
    const results: GameResult = {
      roundId: this.gameState.roundId,
      crashPoint: this.gameState.crashPoint,
      startTime: this.gameState.startTime!,
      endTime: this.gameState.endTime!,
      participants: this.gameState.participants
    };

    // Process all bets
    for (const [playerId, bet] of this.gameState.participants) {
      if (bet.status === 'active') {
        bet.status = 'lost';

        // Record loss transaction
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: playerId,
          type: 'bet',
          amount: -bet.amount,
          status: 'completed',
          createdAt: new Date()
        });
      }
    }

    return results;
  }

  public async placeBet(playerId: string, amount: number, autoMode?: { enabled: boolean; targetMultiplier: number }) {
    // Validate bet
    if (this.gameState.status !== 'betting') {
      throw new Error('Betting phase is closed');
    }

    if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
      throw new Error(`Bet amount must be between ${this.MIN_BET_AMOUNT} and ${this.MAX_BET_AMOUNT}`);
    }

    // Check user balance
 const user = await db.select()
       .from(users)
       .where(eq(users.id, playerId))
      .get();



    if (!user || user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create bet
    const bet: Bet = {
      id: crypto.randomUUID(),
      playerId,
      amount,
      placedAt: new Date(),
      status: 'active',
      autoMode
    };

    // Update database
    await db.transaction(async (tx) => {
      await tx.insert(bets).values({
        id: bet.id,
        playerId: bet.playerId,
        amount: bet.amount,
        placedAt: bet.placedAt,
        status: bet.status,
        autoMode: bet.autoMode ? bet.autoMode : null
      });

      await tx.update(users)
        .set({ balance: user.balance - amount })
        .where(eq(users.id, playerId));
    });

    // Update game state
    this.gameState.participants.set(playerId, bet);

    // Broadcast bet
    this.broadcast('game:bet', {
      playerId,
      amount,
      betId: bet.id
    });

    return bet;
  }

  private broadcast(type: string, data: any) {
    const message = createMessage(type, data);
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

    /**
   * Get the current state of the game
   */
  public async getCurrentState(): Promise<GameState> {
    // Get cached state from Redis if available
    const cachedState = await this.redisClient.get(`game:${this.gameState.roundId}`);
    if (cachedState) {
      return {
        ...JSON.parse(cachedState),
        participants: this.gameState.participants // Use in-memory participants map
      };
    }

    return {
      status: this.gameState.status,
      currentMultiplier: this.gameState.currentMultiplier,
      crashPoint: this.gameState.crashPoint,
      roundId: this.gameState.roundId,
      startTime: this.gameState.startTime,
      endTime: this.gameState.endTime,
      participants: this.gameState.participants
    };
  }

  // /**
  //  * Place a bet for a user
  //  */
  // public async placeBet(
  //   userId: string,
  //   amount: number,
  //   autoMode?: { enabled: boolean; targetMultiplier: number }
  // ): Promise<Bet> {
  //   // Validate game state
  //   if (this.gameState.status !== 'betting') {
  //     throw new Error('Betting phase is closed');
  //   }

  //   if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
  //     throw new Error(`Bet amount must be between ${this.MIN_BET_AMOUNT} and ${this.MAX_BET_AMOUNT}`);
  //   }

  //   // Get user and check balance
  //   const user = await db.select()
  //     .from(users)
  //     .where(eq(users.id, userId))
  //     .get();

  //   if (!user || user.balance < amount) {
  //     throw new Error('Insufficient balance');
  //   }

  //   // Create new bet
  //   const bet: Bet = {
  //     id: crypto.randomUUID(),
  //     playerId: userId,
  //     amount,
  //     placedAt: new Date(),
  //     status: 'active',
  //     autoMode
  //   };

  //   // Update database in transaction
  //   await db.transaction(async (tx) => {
  //     // Insert bet record
  //     await tx.insert(bets).values({
  //       id: bet.id,
  //       playerId: bet.playerId,
  //       amount: bet.amount,
  //       placedAt: bet.placedAt,
  //       status: bet.status,
  //       autoMode: autoMode ? JSON.stringify(autoMode) : null
  //     });

  //     // Update user balance
  //     await tx.update(users)
  //       .set({ balance: user.balance - amount })
  //       .where(eq(users.id, userId));
  //   });

  //   // Update game state
  //   this.gameState.participants.set(userId, bet);

  //   return bet;
  // }

  // /**
  //  * Handle user cashout
  //  */
  // public async handleCashout(userId: string): Promise<{ multiplier: number; payout: number } | null> {
  //   const bet = this.gameState.participants.get(userId);
  //   if (!bet || bet.status !== 'active') {
  //     throw new Error('No active bet found');
  //   }

  //   if (this.gameState.status !== 'flying') {
  //     throw new Error('Game not in flight phase');
  //   }

  //   const user = await db.select()
  //     .from(users)
  //     .where(eq(users.id, userId))
  //     .get();

  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   // Calculate payout
  //   bet.status = 'won';
  //   bet.cashoutMultiplier = this.gameState.currentMultiplier;
  //   const payout = bet.amount * bet.cashoutMultiplier;

  //   // Update database
  //   await db.transaction(async (tx) => {
  //     // Update bet record
  //     await tx.update(bets)
  //       .set({
  //         status: bet.status,
  //         cashoutMultiplier: bet.cashoutMultiplier
  //       })
  //       .where(eq(bets.id, bet.id));

  //     // Update user balance
  //     await tx.update(users)
  //       .set({ balance: user.balance + payout })
  //       .where(eq(users.id, userId));

  //     // Record transaction
  //     await tx.insert(transactions).values({
  //       id: crypto.randomUUID(),
  //       userId: userId,
  //       type: 'win',
  //       amount: payout,
  //       status: 'completed',
  //       createdAt: new Date()
  //     });
  //   });

  //   return {
  //     multiplier: bet.cashoutMultiplier,
  //     payout
  //   };
  // }

  /**
   * Handle user disconnect
   */
  public async handleDisconnect(userId: string): Promise<void> {
    const bet = this.gameState.participants.get(userId);

    // If user has an active bet during crash, mark it as lost
    if (bet && bet.status === 'active' && this.gameState.status === 'crashed') {
      bet.status = 'lost';

      await db.update(bets)
        .set({ status: 'lost' })
        .where(eq(bets.id, bet.id));

      // Record loss transaction
      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId: userId,
        type: 'bet',
        amount: -bet.amount,
        status: 'completed',
        createdAt: new Date()
      });
    }

    // Could add additional cleanup here if needed
    await this.redisClient.del(`user:${userId}:session`);
  }
}

import { SQL, sql } from 'drizzle-orm';

function eq(column: SQLiteColumn, value: string): SQL {
  return sql`${column} = ${value}`;
}
