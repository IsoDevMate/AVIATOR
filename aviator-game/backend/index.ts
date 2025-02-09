// import express from 'express';
// import { createServer } from 'http';
// import dotenv from 'dotenv';
// dotenv.config();
// import session from 'express-session';
// import { createClient, RedisClientType } from 'redis';
// import connectRedis from 'connect-redis';
// import passport from 'passport';
// import { WebSocketServer } from 'ws';
// import { router } from './routes';
// import { handleWebSocketConnection } from './services/websocket.service';
// import './config/passport';


// const app = express();
// const httpServer = createServer(app);

// // Redis setup
// const redisClient: RedisClientType = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379'
// }) as RedisClientType;
// redisClient.connect().catch(console.error);

// // Session middleware
// const RedisStore = connectRedis(session);

// const sessionMiddleware = session({
//   store: new RedisStore({ client: redisClient }),
//   secret: process.env.SESSION_SECRET!,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 72 * 60 * 60 * 1000 // 72 hours
//   }
// });

// app.use(express.json());
// app.use(sessionMiddleware);
// app.use(passport.initialize());
// app.use(passport.session());

// // Routes
// app.use('/api', router);

// // WebSocket server setup
// const wss = new WebSocketServer({ server: httpServer });
// handleWebSocketConnection(wss, redisClient);

// const PORT = process.env.PORT || 3000;
// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



// import express from 'express';
// import { createServer } from 'http';
// import session from 'express-session';
// import RedisStore from 'connect-redis';
// import { createClient } from 'redis';
// import passport from 'passport';
// import { router } from './routes/index';
// import { config } from 'dotenv';
// import { WebSocketServer } from 'ws';
// import jwt from 'jsonwebtoken';
// import './config/passport';

// config();

// const app = express();
// const httpServer = createServer(app);

// // Redis client for session and game state
// const redisClient = createClient({
//   url: process.env.REDIS_URL
// });
// redisClient.connect().catch(console.error);

// // Session middleware
// app.use(session({
//   store: new RedisStore({ client: redisClient }),
//   secret: process.env.SESSION_SECRET!,
//   resave: false,
//   saveUninitialized: false
// }));

// app.use(express.json());
// app.use(passport.initialize());
// app.use(passport.session());

// // Routes
// app.use('/api', router);

// // WebSocket server
// const wss = new WebSocketServer({ server: httpServer });

// wss.on('connection', (ws, req) => {
//   const token = req.url?.split('token=')[1];
//   if (!token) {
//     ws.close(4001, 'Unauthorized');
//     return;
//   }

//   jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
//     if (err) {
//       ws.close(4001, 'Unauthorized');
//       return;
//     }

//     // User is authenticated
//     ws.on('message', (message) => {
//       console.log(`Received message: ${message}`);
//       // Handle messages
//     });

//     ws.send('Welcome to the WebSocket server!');
//   });
// });

// // Error handling
// app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Internal Server Error' });
// });

// const PORT = process.env.PORT || 3000;
// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import { createClient, RedisClientType } from 'redis';
import * as connectRedis from 'connect-redis';
import passport from 'passport';
import { WebSocketServer } from 'ws';
import { router } from './routes';
import { handleWebSocketConnection } from './services/websocket.service';
import dotenv from 'dotenv';
import { databaseService } from './db/database';
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize client.
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: true
});

// Initialize store.
const RedisStore = connectRedis.default(session);

// Connect to redis
redisClient.connect().catch(console.error);

// Initialize session storage.
const sessionStore = new RedisStore({
  client: redisClient as any,
  prefix: "aviator:"
});

// Configure session middleware
app.use(express.json());
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 72 * 60 * 60 * 1000 // 72 hours
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', router);

// WebSocket server setup
const wss = new WebSocketServer({ server: httpServer });
handleWebSocketConnection(wss, redisClient as RedisClientType);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
// Test connection on startup
async function validateDatabaseConnection() {
  try {
    const connectionStatus = await databaseService.testConnection();
    console.log(connectionStatus.message);

    // Optionally get database stats
    const stats = await databaseService.getDatabaseStats();
    console.log('Database Stats:', stats);
  } catch (error) {
    console.error('Database validation failed:', error);
    process.exit(1);
  }
}


(async () => {
  await validateDatabaseConnection();

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
