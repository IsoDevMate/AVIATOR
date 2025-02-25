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

//   wss.on('connection', async (ws: WebSocket, req) => {
//     const authWs = ws as AuthenticatedWebSocket;
//     console.log('New WebSocket connection attempt');

//     // Extract token from query string
//     const url = req.url ? new URL(req.url, 'ws://localhost') : null;
//     const token = url?.searchParams.get('token');

//     if (!token) {
//       console.log('Connection rejected: No token provided');
//       ws.close(4001, 'No token provided');
//       return;
//     }

//     try {
//       // Verify JWT token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
//       authWs.userId = decoded.id;
//       authWs.isAlive = true;
//       console.log(`User ${decoded.id} authenticated successfully`);

//       // Set up ping-pong for connection health check
//       ws.on('pong', () => {
//         authWs.isAlive = true;
//         console.log(`Received pong from user ${authWs.userId}`);
//       });

//       // Handle incoming messages
//       ws.on('message', async (message) => {
//         // const data = message as Buffer;
//         const { type, data } = parseMessage(message.toString());
//         console.log('Raw message received:', data.toString());

//         try {
//           // const message = parseMessage(data.toString());
//           console.log('Parsed message:', message);

//           switch (type) {
//             case 'game:join':
//               console.log(`Processing game:join request for user ${authWs.userId}`);
//               try {
//                 const gameState = await gameService.getCurrentState();
//                 console.log('Current game state:', gameState);
//                 const response = createMessage('game:state', gameState);
//                 console.log('Sending response:', response);
//                 ws.send(response);
//               } catch (error) {
//                 console.error('Error getting game state:', error);
//                 ws.send(createMessage('error', {
//                   message: 'Failed to get game state',
//                   details: error instanceof Error ? error.message : 'Unknown error'
//                 }));
//               }
//               break;

//             // case 'game:bet':
//             //   console.log(`Processing game:bet request for user ${authWs.userId}:`, message.data);
//             //   if (!message.data?.amount) {
//             //     console.log('Invalid bet: no amount specified');
//             //     ws.send(createMessage('error', { message: 'Invalid bet amount' }));
//             //     return;
//             //   }

//             //   try {
//             //     const bet = await gameService.placeBet(
//             //       authWs.userId!,
//             //       message.data.amount,
//             //       message.data.autoMode
//             //     );
//             //     console.log('Bet placed successfully:', bet);

//             //     // Broadcast bet to all clients
//             //     const broadcastMessage = createMessage('game:bet', {
//             //       userId: authWs.userId,
//             //       amount: message.data.amount,
//             //       timestamp: Date.now()
//             //     });
//             //     console.log('Broadcasting bet:', broadcastMessage);

//             //     wss.clients.forEach((client) => {
//             //       if (client.readyState === WebSocket.OPEN) {
//             //         client.send(broadcastMessage);
//             //       }
//             //     });
//             //   } catch (error) {
//             //     console.error('Error placing bet:', error);
//             //     ws.send(createMessage('error', {
//             //       message: error instanceof Error ? error.message : 'Bet failed',
//             //       details: error instanceof Error ? error.stack : undefined
//             //     }));
//             //   }
//             //   break;
//              case 'place_bet':
//               try {
//                 await gameService.placeBet(data.playerId,         data.amount, data.autoMode);
//               } catch (error) {
//                 const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//                 ws.send(createMessage('bet_error', { message: errorMessage }));
//               }
//               break;

//             case 'cashout':
//               try {
//                 await gameService.handleCashout(data.        playerId);
//               } catch (error) {
//                 const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//                 ws.send(createMessage('cashout_error', { message: errorMessage }));
//               }
//               break;
//             default:
//               console.log('Unknown message type:', type);
//               ws.send(createMessage('error', { message: 'Unknown message type' }));
//           }
//         } catch (error) {
//           console.error('Message handling error:', error);
//           ws.send(createMessage('error', { message: 'Invalid message format' }));
//         }
//       });

//       // Handle client disconnect
//       ws.on('close', () => {
//         console.log(`User ${authWs.userId} disconnected`);
//         if (authWs.userId) {
//           gameService.handleDisconnect(authWs.userId);
//         }
//       });

//       console.log(`WebSocket connection established for user ${authWs.userId}`);

//     } catch (error) {
//       console.log('Connection rejected: Invalid token');
//       ws.close(4001, 'Invalid token');
//     }
//   });

//   // Set up heartbeat interval
//   const interval = setInterval(() => {
//     wss.clients.forEach((ws) => {
//       const authWs = ws as AuthenticatedWebSocket;
//       if (authWs.isAlive === false) {
//         console.log(`Terminating inactive connection for user ${authWs.userId}`);
//         return ws.terminate();
//       }

//       authWs.isAlive = false;
//       ws.ping();
//     });
//   }, 30000);

//   wss.on('close', () => {
//     clearInterval(interval);
//   });
// }


import { WebSocket, WebSocketServer } from 'ws';
import { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import { GameService } from './game.service';
import { parseMessage, createMessage } from '../utils/websocket.utils';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

export function handleWebSocketConnection(wss: WebSocketServer, redisClient: RedisClientType) {
  const gameService = GameService.getInstance(redisClient, wss);

  wss.on('connection', async (ws: WebSocket, req) => {
    const authWs = ws as AuthenticatedWebSocket;
    console.log('New WebSocket connection attempt');

    // Extract token from query string
    const url = req.url ? new URL(req.url, 'ws://localhost') : null;
    const token = url?.searchParams.get('token');

    if (!token) {
      console.log('Connection rejected: No token provided');
      ws.close(4001, 'No token provided');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      authWs.userId = decoded.id;
      authWs.isAlive = true;
      console.log(`User ${decoded.id} authenticated successfully`);

      // Register player with GameService
      gameService.handlePlayerConnection(decoded.id);

      // Set up ping-pong for connection health check
      ws.on('pong', () => {
        authWs.isAlive = true;
        console.log(`Received pong from user ${authWs.userId}`);
      });

      // Handle incoming messages
      ws.on('message', async (message: Buffer) => {
        console.log('Raw message received:', message.toString());

        try {

          const parsedMessage = parseMessage(message.toString());
          console.log('Successfully parsed message:', parsedMessage);
          const { type, data } = parsedMessage;


          console.log('Processing message type:', type);

          switch (type) {
            case 'place_bet':
              console.log('Attempting to place bet:', data);
              try {
                await gameService.placeBet(
                  authWs.userId!,
                  Number(data.amount),
                  data.autoMode
                );
                // Add success response
                ws.send(createMessage('bet_placed', {
                  success: true,
                  amount: data.amount
                }));
                console.log('Bet placed successfully');
              } catch (error) {
                console.error('Failed to place bet:', error);
                ws.send(createMessage('error', {
                  message: error instanceof Error ? error.message : 'Bet failed'
                }));
              }
              break;

            case 'cashout':
              console.log('Attempting cashout for user:', authWs.userId);
              try {
                await gameService.handleCashout(authWs.userId!);
                ws.send(createMessage('cashout_success', { success: true }));
                console.log('Cashout successful');
              } catch (error) {
                console.error('Cashout failed:', error);
                ws.send(createMessage('error', {
                  message: error instanceof Error ? error.message : 'Cashout failed'
                }));
              }
              break;

             default:
               console.log('Unknown message type:', type);
               ws.send(createMessage('error', {
                 message: `Unknown message type: ${type}`
               }));
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
    ws.send(createMessage('error', {
      message: 'Invalid message format',
      details: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
});


      ws.on('close', () => {
        console.log(`User ${authWs.userId} disconnected`);
        if (authWs.userId) {
          gameService.handlePlayerDisconnection(authWs.userId);
        }
      });

      console.log(`WebSocket connection established for user ${authWs.userId}`);

    } catch (error) {
      console.log('Connection rejected: Invalid token');
      ws.close(4001, 'Invalid token');
    }
  });

  //interval conn check
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (authWs.isAlive === false) {
        console.log(`Terminating inactive connection for user ${authWs.userId}`);
        return ws.terminate();
      }

      authWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}
