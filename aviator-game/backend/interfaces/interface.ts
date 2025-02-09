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

export interface GameState {
  status: 'betting' | 'flying' | 'crashed';
  currentMultiplier: number;
  crashPoint: number;
  roundId: string;
  startTime?: Date;
  endTime?: Date;
  participants: Map<string, Bet>;
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
