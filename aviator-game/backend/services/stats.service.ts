// export class StatsService {
//   private static instance: StatsService;

//   static getInstance() {
//     if (!StatsService.instance) {
//       StatsService.instance = new StatsService();
//     }
//     return StatsService.instance;
//   }

//   async updateUserStats(userId: string, gameResult: any) {
//     const key = `stats:user:${userId}`;
//     const stats = await redis.hgetall(key) || {
//       gamesPlayed: 0,
//       totalWagered: 0,
//       totalWon: 0,
//       highestMultiplier: 0,
//       averageMultiplier: 0
//     };

//     stats.gamesPlayed++;
//     stats.totalWagered += gameResult.betAmount;
//     stats.totalWon += gameResult.payout;
//     stats.highestMultiplier = Math.max(stats.highestMultiplier, gameResult.multiplier);
//     stats.averageMultiplier =
//       (stats.averageMultiplier * (stats.gamesPlayed - 1) + gameResult.multiplier) /
//       stats.gamesPlayed;

//     await redis.hset(key, stats);
//     return stats;
//   }
// }
