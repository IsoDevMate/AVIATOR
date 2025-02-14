// export class AnalyticsService {
//   private static instance: AnalyticsService;

//   async generateUserReport(userId: string, timeframe: 'daily' | 'weekly' | 'monthly') {
//     const stats = await redis.hgetall(`stats:user:${userId}`);
//     const bets = await db.select()
//       .from(bets)
//       .where({ userId })
//       .orderBy('createdAt', 'desc')
//       .limit(1000);

//     return {
//       overview: {
//         totalGames: stats.gamesPlayed,
//         winRate: (stats.gamesWon / stats.gamesPlayed) * 100,
//         averageMultiplier: stats.averageMultiplier,
//         profitLoss: stats.totalWon - stats.totalWagered,
//         roi: ((stats.totalWon - stats.totalWagered) / stats.totalWagered) * 100
//       },
//       patterns: {
//         bestTimeOfDay: this.analyzeBestPlayTime(bets),
//         mostProfitableMultipliers: this.analyzeMultipliers(bets),
//         streaks: this.analyzeStreaks(bets),
//         riskProfile: this.calculateRiskProfile(bets)
//       },
//       recommendations: this.generateRecommendations(stats, bets)
//     };
//   }

//   async generateGameReport(timeframe: 'hourly' | 'daily' | 'weekly') {
//     const rounds = await db.select()
//       .from(gameRounds)
//       .orderBy('createdAt', 'desc')
//       .limit(1000);

//     return {
//       gameMetrics: {
//         averageCrashPoint: this.calculateAverageCrashPoint(rounds),
//         distribution: this.analyzeCrashPointDistribution(rounds),
//         playerEngagement: await this.analyzePlayerEngagement(rounds),
//         houseEdgeRealization: this.calculateHouseEdge(rounds)
//       },
//       playerMetrics: {
//         activePlayers: await this.countActivePlayers(timeframe),
//         newPlayers: await this.countNewPlayers(timeframe),
//         retentionRate: await this.calculateRetention(timeframe),
//         averageSessionLength: await this.calculateAverageSession(timeframe)
//       }
//     };
//   }

//   private analyzePlayerBehavior(bets: any[]) {
//     // Implement behavior analysis
//   }
// }
