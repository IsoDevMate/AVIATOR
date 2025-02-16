import { WebSocket, WebSocketServer } from 'ws';
import { setTimeout } from 'timers';
type Timeout = ReturnType<typeof setTimeout>;
import { RedisClientType } from 'redis';
import { randomBytes } from 'crypto';
import { db } from '../db/database';
import { bets,InsertTransaction, transactions, users } from '../models/schema';
import { createMessage } from '../utils/websocket.utils';
import { GameState,PendingBet, GameResult, GameBalance, GameParticipant } from '../interfaces/interface';
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
    private pendingBets: Map<string, PendingBet> = new Map();
  private connectedPlayers: Set<string> = new Set();

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
      this.gameBalances.set(userId, user?.balance || 1000);
    }
    const balance = this.gameBalances.get(userId) || 1000;
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
      const insertData: InsertTransaction = {
        id: transactionId,
        userId,
        type: 'deposit',
        amount,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: Date.now()
      };
      await tx.insert(transactions).values(insertData);
      console.log(`✅ Transfer completed - Transaction ID: ${transactionId}`);
    });
  }

  private async processPendingBets() {
    console.log('📋 Processing pending bets for new round');
    const currentPendingBets = Array.from(this.pendingBets.entries());

    for (const [playerId, bet] of currentPendingBets) {
      // Only process bets for connected players
      if (this.connectedPlayers.has(playerId)) {
        try {
          await this.placeBet(playerId, bet.amount, bet.autoMode);
          this.pendingBets.delete(playerId);
          console.log(`✅ Processed pending bet for player ${playerId}`);
        } catch (error) {
          console.error(`❌ Failed to process pending bet for player ${playerId}:`, error);
        }
      } else {
        // Remove pending bets for disconnected players
        this.pendingBets.delete(playerId);
        console.log(`🚫 Removed pending bet for disconnected player ${playerId}`);
      }
    }
  }

  private generateCrashPoint(): number {
    const e = 2 ** 32;
    const h = randomBytes(4).readUInt32BE(0);
    const crashPoint = Math.max(1.0, (100 * e - h) / (e - h)) / 100;
    console.log(`🎯 Generated crash point: ${crashPoint}x`);
    return crashPoint;
  }

   public handlePlayerConnection(playerId: string) {
    console.log(`🔌 Player connected: ${playerId}`);
    this.connectedPlayers.add(playerId);
  }

  public handlePlayerDisconnection(playerId: string) {
    console.log(`👋 Player disconnected: ${playerId}`);
    this.connectedPlayers.delete(playerId);
    // Optionally clear pending bets for disconnected player
    if (this.pendingBets.has(playerId)) {
      this.pendingBets.delete(playerId);
      console.log(`🧹 Cleared pending bet for disconnected player ${playerId}`);
    }
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

  public async handleCashout(playerId: string): Promise<void> {
    console.log(`💰 Cashout attempt - Player: ${playerId}`);

    const participant = this.gameState.participants.get(playerId);
    if (!participant || participant.betStatus !== 'active') {
      console.error(`❌ Invalid cashout: No active bet found for player ${playerId}`);
      throw new Error('No active bet found');
    }

    if (this.gameState.status !== 'flying') {
      console.error(`❌ Invalid cashout: Game not in flight phase`);
      throw new Error('Game not in flight phase');
    }

    const winAmount = participant.betAmount * this.gameState.currentMultiplier;
    participant.betStatus = 'cashed_out';
    participant.cashoutMultiplier = this.gameState.currentMultiplier;
    participant.winAmount = winAmount;

    console.log(`💫 Successful cashout for ${participant.username}:`);
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

  public async handleCrash() {
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
    if (amount < this.MIN_BET_AMOUNT || amount > this.MAX_BET_AMOUNT) {
      console.error(`❌ Invalid bet amount for player ${playerId}`);
      throw new Error('Invalid bet amount');
    }

    console.log(`🎲 Bet placement attempt - Player: ${playerId}, Amount: ${amount}`);

    if (this.gameState.status !== 'betting') {
      console.log('⏳ Betting phase closed, storing as pending bet');
      this.pendingBets.set(playerId, {
        playerId,
        amount,
        autoMode,
        timestamp: new Date()
      });

      throw new Error('Betting phase is closed. Your bet will be placed in the next round.');
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

    console.log(`✅ Bet placed successfully for ${user.username}`);

    this.broadcast('game:bet_placed', {
      playerId,
      username: user.username,
      betAmount: amount,
      timestamp: new Date()
    })
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
     const transactionId = crypto.randomUUID();

    console.log(`👋 User ${userId} disconnected`);
    const participant = this.gameState.participants.get(userId);

    if (participant && participant.betStatus === 'active' && this.gameState.status === 'crashed') {
      console.log(`   ❌ Active bet marked as lost`);
      participant.betStatus = 'lost';

      await db.update(bets)
        .set({ status: 'lost' })
        .where(eq(bets.id, participant.id));

       const insertData: InsertTransaction = {
      id: transactionId,
      userId,
      type: 'deposit',
      amount: participant.betAmount,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: Date.now()
    };

      await db.insert(transactions).values(insertData);
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
