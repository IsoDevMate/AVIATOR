// // import { WebSocket, WebSocketServer } from 'ws';
// // import { RedisClientType } from 'redis';
// // import jwt from 'jsonwebtoken';
// // import { GameService } from './game.service';
// // import { parseMessage, createMessage } from '../utils/websocket.utils';

// // interface AuthenticatedWebSocket extends WebSocket {
// //   userId?: string;
// //   isAlive: boolean;
// // }

// // export function handleWebSocketConnection(wss: WebSocketServer, redisClient: RedisClientType) {
// //   const gameService = GameService.getInstance();

// //   // Set up heartbeat interval
// //   const interval = setInterval(() => {
// //     wss.clients.forEach((ws: AuthenticatedWebSocket) => {
// //       if (ws.isAlive === false) return ws.terminate();

// //       ws.isAlive = false;
// //       ws.ping();
// //     });
// //   }, 30000);

// //   wss.on('close', () => {
// //     clearInterval(interval);
// //   });

// //   wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
// //     // Extract token from query string
// //     const token = new URL(req.url!, 'ws://localhost').searchParams.get('token');

// //     if (!token) {
// //       ws.close(4001, 'No token provided');
// //       return;
// //     }

// //     try {
// //       // Verify JWT token
// //       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
// //       ws.userId = decoded.id;
// //       ws.isAlive = true;

// //       // Set up ping-pong for connection health check
// //       ws.on('pong', () => {
// //         ws.isAlive = true;
// //       });

// //       // Handle incoming messages
// //       ws.on('message', async (data) => {
// //         try {
// //           const message = parseMessage(data.toString());

// //           switch (message.type) {
// //             case 'game:join':
// //               const gameState = await gameService.getCurrentState();
// //               ws.send(createMessage('game:state', gameState));
// //               break;

// //             case 'game:bet':
// //               if (!message.data?.amount) {
// //                 ws.send(createMessage('error', { message: 'Invalid bet amount' }));
// //                 return;
// //               }

// //               try {
// //                 const bet = await gameService.placeBet(ws.userId!, message.data.amount);
// //                 // Broadcast bet to all clients
// //                 wss.clients.forEach((client: AuthenticatedWebSocket) => {
// //                   if (client.readyState === WebSocket.OPEN) {
// //                     client.send(createMessage('game:bet', {
// //                       userId: ws.userId,
// //                       amount: message.data.amount,
// //                       timestamp: Date.now()
// //                     }));
// //                   }
// //                 });
// //               } catch (error) {
// //                 ws.send(createMessage('error', { message: (error as Error).message }));
// //               }
// //               break;

// //             case 'game:cashout':
// //               try {
// //                 const result = await gameService.cashOut(ws.userId!);
// //                 if (result) {
// //                   // Broadcast cashout to all clients
// //                   wss.clients.forEach((client: AuthenticatedWebSocket) => {
// //                     if (client.readyState === WebSocket.OPEN) {
// //                       client.send(createMessage('game:cashout', {
// //                         userId: ws.userId,
// //                         multiplier: result.multiplier,
// //                         timestamp: Date.now()
// //                       }));
// //                     }
// //                   });
// //                 }
// //               } catch (error) {
// //                 ws.send(createMessage('error', { message: (error as Error).message }));
// //               }
// //               break;
// //           }
// //         } catch (error) {
// //           ws.send(createMessage('error', { message: 'Invalid message format' }));
// //         }
// //       });

// //       // Handle client disconnect
// //       ws.on('close', () => {
// //         // Clean up any user-specific resources
// //         gameService.handleDisconnect(ws.userId!);
// //       });

// //     } catch (error) {
// //       ws.close(4001, 'Invalid token');
// //     }
// //   });
// // }

// import { WebSocket, WebSocketServer } from 'ws';
// import { RedisClientType } from 'redis';
// import jwt from 'jsonwebtoken';
// import { GameService } from './game.service';
// import { parseMessage, createMessage } from '../utils/websocket.utils';

// interface AuthenticatedWebSocket extends WebSocket {
//   userId?: string;
//   isAlive: boolean;
// }

// export function handleWebSocketConnection(wss: WebSocketServer, redisClient: RedisClientType) {
//   const gameService = GameService.getInstance(redisClient, wss);

//   // Set up heartbeat interval
//   const interval = setInterval(() => {
//     wss.clients.forEach((ws: AuthenticatedWebSocket) => {
//       if (ws.isAlive === false) return (ws as WebSocket).terminate();

//       ws.isAlive = false;
//       (ws as WebSocket).ping();
//     });
//   }, 30000);

//   wss.on('close', () => {
//     clearInterval(interval);
//   });

//   wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
//     // Extract token from query string
//     const token = new URL(req.url!, 'ws://localhost').searchParams.get('token');

//     if (!token) {
//       (ws as WebSocket).close(4001, 'No token provided');
//       return;
//     }

//     try {
//       // Verify JWT token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
//       ws.userId = decoded.id;
//       ws.isAlive = true;

//       // Set up ping-pong for connection health check
//      (ws as WebSocket).on('pong', () => {
//         ws.isAlive = true;
//       });

//       // Handle incoming messages
//      (ws as WebSocket).on('message', async (data) => {
//         try {
//           const message = parseMessage(data.toString());

//           switch (message.type) {
//             case 'game:join':
//               const gameState = await gameService.getCurrentState();
//              (ws as WebSocket).send(createMessage('game:state', gameState));
//               break;

//             case 'game:bet':
//               if (!message.data?.amount) {
//                (ws as WebSocket).send(cr(at as WebSocket)eMessage('error', { message: 'Invalid bet amount' }));
//                 return;
//               }

//               try {
//                 const bet = await gameService.placeBet(ws.userId!, message.data.amount);
//                 // Broadcast bet to all clients
//                 wss.clients.forEach((client: AuthenticatedWebSocket) => {
//                   if (client.readyState === WebSocket.OPEN) {
//                     client.send(createMessage('game:bet', {
//                       userId: ws.userId,
//                       amount: message.data.amount,
//                       timestamp: Date.now()
//                     }));
//                   }
//                 });
//               } catch (error) {
//                (ws as WebSocket).send(createMessage('error', { message: (error as Error).message }));
//               }
//               break;

//             case 'game:cashout':
//               try {
//                 const result = await gameService.cashOut(ws.userId!);
//                 if (result) {
//                   // Broadcast cashout to all clients
//                   wss.clients.forEach((client: AuthenticatedWebSocket) => {
//                     if (client.readyState === WebSocket.OPEN) {
//                       client.send(createMessage('game:cashout', {
//                         userId: ws.userId,
//                         multiplier: result.multiplier,
//                         timestamp: Date.now()
//                       }));
//                     }
//                   });
//                 }
//               } catch (error) {
//                (ws as WebSocket).send(createMessage('error', { message: (error as Error).message }));
//               }
//               break;
//           }
//         } catch (error) {
//          (ws as WebSocket).send(createMessage('error', { message: 'Invalid message format' }));
//         }
//       });

//       // Handle client disconnect
//      (ws as WebSocket).on('close', () => {
//         // Clean up any user-specific resources
//         gameService.handleDisconnect(ws.userId!);
//       });

//     } catch (error) {
//      (ws as WebSocket).close(4001, 'Invalid token');
//     }
//   });
// }


import { WebSocket, WebSocketServer } from 'ws';
import { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import { GameService } from './game.service';
import { parseMessage, createMessage } from '../utils/websocket.utils';

// Enhanced interface for authenticated WebSocket
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

export function handleWebSocketConnection(wss: WebSocketServer, redisClient: RedisClientType) {
  const gameService = GameService.getInstance(redisClient, wss);

  // Set up heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (authWs.isAlive === false) return ws.terminate();

      authWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', async (ws: WebSocket, req) => {
    const authWs = ws as AuthenticatedWebSocket;

    // Extract token from query string
    const url = req.url ? new URL(req.url, 'ws://localhost') : null;
    const token = url?.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'No token provided');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      authWs.userId = decoded.id;
      authWs.isAlive = true;

      // Set up ping-pong for connection health check
      ws.on('pong', () => {
        authWs.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = parseMessage(data.toString());

          switch (message.type) {
            case 'game:join':
              try {
                const gameState = await gameService.getCurrentState();
                ws.send(createMessage('game:state', gameState));
              } catch (error) {
                ws.send(createMessage('error', { message: 'Failed to get game state' }));
              }
              break;

            case 'game:bet':
              if (!message.data?.amount) {
                ws.send(createMessage('error', { message: 'Invalid bet amount' }));
                return;
              }

              try {
                const bet = await gameService.placeBet(authWs.userId!, message.data.amount);
                // Broadcast bet to all clients
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(createMessage('game:bet', {
                      userId: authWs.userId,
                      amount: message.data.amount,
                      timestamp: Date.now()
                    }));
                  }
                });
              } catch (error) {
                ws.send(createMessage('error', { message: error instanceof Error ? error.message : 'Bet failed' }));
              }
              break;

            case 'game:cashout':
            try {
              const result = await gameService.handleCashout(authWs.userId!);
              if (result) {
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(createMessage('game:cashout', {
                      userId: authWs.userId,
                      multiplier: result.currentMultiplier,
                      payout: result.payout,
                      timestamp: Date.now()
                    }));
                  }
                });
              }
            } catch (error) {
              ws.send(createMessage('error', {
                message: error instanceof Error ? error.message : 'Cashout failed'
              }));
            }
            break;

            default:
              ws.send(createMessage('error', { message: 'Unknown message type' }));
          }
        } catch (error) {
          ws.send(createMessage('error', { message: 'Invalid message format' }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        if (authWs.userId) {
          gameService.handleDisconnect(authWs.userId);
        }
      });

    } catch (error) {
      ws.close(4001, 'Invalid token');
    }
  });
}
