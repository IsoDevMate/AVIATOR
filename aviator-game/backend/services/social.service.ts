// export class SocialService {
//   private static instance: SocialService;

//   async addFriend(userId: string, friendId: string) {
//     // Verify both users exist
//     const [user, friend] = await Promise.all([
//       db.select().from(users).where({ id: userId }).first(),
//       db.select().from(users).where({ id: friendId }).first()
//     ]);

//     if (!user || !friend) {
//       throw new Error('User not found');
//     }

//     // Create friendship
//     await db.insert(friendships).values({
//       id: crypto.randomUUID(),
//       userId,
//       friendId,
//       status: 'pending',
//       createdAt: new Date()
//     });

//     // Notify friend about request
//     await this.notifyUser(friendId, {
//       type: 'FRIEND_REQUEST',
//       from: userId,
//       timestamp: new Date()
//     });
//   }

//   async createPrivateChat(userIds: string[]) {
//     const chatId = crypto.randomUUID();

//     await db.insert(privateChats).values({
//       id: chatId,
//       createdAt: new Date()
//     });

//     // Add participants
//     await Promise.all(userIds.map(userId =>
//       db.insert(chatParticipants).values({
//         chatId,
//         userId,
//         joinedAt: new Date()
//       })
//     ));

//     return chatId;
//   }

//   async sendPrivateMessage(chatId: string, userId: string, content: string) {
//     // Verify user is in chat
//     const participant = await db.select()
//       .from(chatParticipants)
//       .where({ chatId, userId })
//       .first();

//     if (!participant) {
//       throw new Error('Not a chat participant');
//     }

//     const message = {
//       id: crypto.randomUUID(),
//       chatId,
//       userId,
//       content,
//       createdAt: new Date()
//     };

//     // Store message
//     await db.insert(chatMessages).values(message);

//     // Notify other participants
//     const others = await db.select()
//       .from(chatParticipants)
//       .where({ chatId })
//       .whereNot({ userId });

//     await Promise.all(others.map(p =>
//       this.notifyUser(p.userId, {
//         type: 'PRIVATE_MESSAGE',
//         chatId,
//         from: userId,
//         timestamp: new Date()
//       })
//     ));

//     return message;
//   }
// }
