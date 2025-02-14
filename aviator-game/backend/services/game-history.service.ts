// export class GameHistoryService {
//   constructor(
//     private redisClient: RedisClient,
//     private db: DatabaseType
//   ) {}

//   private readonly RECENT_GAMES_KEY = 'aviator:recent_games';
//   private readonly RECENT_GAMES_LIMIT = 50;

//   async recordGameResult(gameResult: GameResult) {
//     // Store in Redis for quick access
//     await this.redisClient
//       .multi()
//       .lPush(this.RECENT_GAMES_KEY, JSON.stringify(gameResult))
//       .lTrim(this.RECENT_GAMES_KEY, 0, this.RECENT_GAMES_LIMIT - 1)
//       .exec();

//     // Store in SQLite for persistence
//     await this.db.insert(gameHistory).values({
//       crashPoint: gameResult.crashPoint,
//       totalBets: gameResult.totalBets,
//       totalPlayers: gameResult.players.size,
//       timestamp: new Date(),
//       gameHash: gameResult.gameHash
//     });
//   }

//   async getRecentGames(): Promise<GameResult[]> {
//     const games = await this.redisClient.lRange(this.RECENT_GAMES_KEY, 0, -1);
//     return games.map(game => JSON.parse(game));
//   }

//   async getGameHistory(
//     filters: GameHistoryFilters
//   ): Promise<PaginatedGameHistory> {
//     return await this.db.query.gameHistory.findMany({
//       where: {
//         timestamp: gte(filters.startDate),
//         crashPoint: gte(filters.minMultiplier || 0)
//       },
//       orderBy: desc(gameHistory.timestamp),
//       limit: filters.limit,
//       offset: filters.offset
//     });
//   }
// }
