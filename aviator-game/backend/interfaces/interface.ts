// export interface Player {
//   id: string;
//   socketId: string;
//   balance: number;
//   activeBets: Bet[];
//   isAuthenticated: boolean;
//   googleId?: string;
//   email?: string;
// }

// export interface Bet {
//   id: string;
//   playerId: string;
//   amount: number;
//   placedAt: Date;
//   cashoutMultiplier?: number;
//   status: 'active' | 'won' | 'lost';
//   autoMode?: {
//     enabled: boolean;
//     targetMultiplier: number;
//   };
// }

// export interface GameState {
//   status: 'betting' | 'flying' | 'crashed';
//   currentMultiplier: number;
//   crashPoint: number;
//   startTime?: Date;
//   endTime?: Date;
//   roundId: string;
//   participants: Map<string, Bet>;
// }

export interface GameBalance {
  userId: string;
  amount: number;
}

export interface PendingBet {
  playerId: string;
  amount: number;
  autoMode?: {
    enabled: boolean;
    targetMultiplier: number;
  };
  timestamp: Date;
}

export interface GameBet {
  userId: string;
  amount: number;
  autoMode?: {
    enabled: boolean;
    targetMultiplier: number;
  };
}

export interface GameJoin {
  userId: string;
}

export interface GameMessage {
  type: 'game:join' | 'game:bet' | 'game:balance';
  data: GameJoin | GameBet | GameBalance;
}

export interface GameError {
  message: string;
  details?: string;
}

export interface GameBetBroadcast {
  userId: string;
  amount: number;
  timestamp: number;
}

export interface GameBetError {
  message: string;
  details?: string;
}

export interface GameParticipant {
  id: string;
  username: string;
  betAmount: number;
  betStatus: 'active' | 'cashed_out' | 'lost';
  cashoutMultiplier?: number;
  winAmount?: number;
  autoMode?: {
    enabled: boolean;
    targetMultiplier: number;
  };
}

export interface GameState {
  status: 'betting' | 'flying' | 'crashed';
  currentMultiplier: number;
  crashPoint: number;
  roundId: string;
  startTime: Date;
  endTime?: Date;
  participants: Map<string, GameParticipant>;
  roundHistory: Array<{
    playerId: string;
    username: string;
    cashoutMultiplier: number;
    betAmount: number;
    winAmount: number;
    timestamp: Date;
  }>;
}

export interface Bet {
  id: string;
  playerId: string;
  amount: number;
  placedAt: Date;
  status: 'active' | 'won' | 'lost';
  cashoutMultiplier?: number;
  autoMode?: {
    enabled: boolean;
    targetMultiplier: number;
  };
}

export interface GameResult {
  roundId: string;
  crashPoint: number;
  startTime: Date;
  endTime: Date;
  participants: Map<string, Bet>;
}
