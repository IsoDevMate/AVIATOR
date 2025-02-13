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
import { databaseService } from './db/database';
import dotenv from 'dotenv';

dotenv.config();


const createSecureRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'rediss://red-cujq3a8gph6c73bkch8g:pMOWloiozT4sXTlVJrpwplMd3pzUBrtj@oregon-redis.render.com:6379',
    socket: {
      tls: true,
      rejectUnauthorized: true,
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        return Math.min(2 ** retries * 100, 3000);
      }
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    if (err.message.includes('AUTH')) {
      console.error('Authentication failed. Check credentials and IP allowlist.');
    }
    if (err.message.includes('ENOTFOUND')) {
      console.error('Could not resolve Redis hostname. Please check the URL.');
    }
    if (err.message.includes('ECONNREFUSED')) {
      console.error('Connection refused. Please check if Redis is running and the port is correct.');
    }
  });

  client.on('connect', () => {
    console.log('Redis Client Connected Successfully');
  });

  return client;
};

const initializeServer = async () => {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Redis client
  const redisClient = createSecureRedisClient();

  try {
    // Connect to Redis
    await redisClient.connect();

    // Test Redis connection
    await redisClient.ping();
    console.log('Redis connection test successful');

    // Initialize session store
    const RedisStore = connectRedis.default(session);
    const sessionStore = new RedisStore({
      client: redisClient as any,
      prefix: "aviator:"
    });

    // Configure middleware
    app.use(express.json());
    app.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'development' ? false : true,
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

    // Validate database connection
    const connectionStatus = await databaseService.testConnection();
    console.log(connectionStatus.message);
    const stats = await databaseService.getDatabaseStats();
    console.log('Database Stats:', stats);

    // Start server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      await redisClient.quit();
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer().catch(error => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});
