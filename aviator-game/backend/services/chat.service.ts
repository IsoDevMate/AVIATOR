// export class ChatService {
//   private readonly CHAT_HISTORY_KEY = 'aviator:chat:history';
//   private readonly CHAT_HISTORY_LIMIT = 100;
//   private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
//   private readonly MAX_MESSAGES_PER_WINDOW = 10;

//   constructor(
//     private io: Server,
//     private redisClient: RedisClient
//   ) {}

//   async handleMessage(socket: Socket, message: ChatMessage) {
//     // Rate limiting
//     const userRateKey = `chat:ratelimit:${socket.userId}`;
//     const messageCount = await this.redisClient.incr(userRateKey);

//     if (messageCount === 1) {
//       await this.redisClient.pExpire(userRateKey, this.RATE_LIMIT_WINDOW);
//     } else if (messageCount > this.MAX_MESSAGES_PER_WINDOW) {
//       socket.emit('error', { message: 'Rate limit exceeded' });
//       return;
//     }

//     // Process message
//     const enrichedMessage = {
//       ...message,
//       userId: socket.userId,
//       username: await this.getUserName(socket.userId),
//       timestamp: Date.now()
//     };

//     // Store in Redis
//     await this.redisClient
//       .multi()
//       .lPush(this.CHAT_HISTORY_KEY, JSON.stringify(enrichedMessage))
//       .lTrim(this.CHAT_HISTORY_KEY, 0, this.CHAT_HISTORY_LIMIT - 1)
//       .exec();

//     // Broadcast to all clients
//     this.io.emit('chat:message', enrichedMessage);
//   }

//   async getChatHistory(): Promise<ChatMessage[]> {
//     const messages = await this.redisClient.lRange(this.CHAT_HISTORY_KEY, 0, -1);
//     return messages.map(msg => JSON.parse(msg));
//   }

//   private async getUserName(userId: string): Promise<string> {
//     return await this.redisClient.hGet(`user:${userId}`, 'username');
//   }
// }
