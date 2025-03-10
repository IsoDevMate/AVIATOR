import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import { createClient, RedisClientType } from 'redis';
import * as connectRedis from 'connect-redis';
import { WebSocketServer } from 'ws';
import { router } from './routes';
import { handleWebSocketConnection } from './services/websocket.service';
import { databaseService } from './db/database';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
import { paymentRouter } from './routes/pay'
import { setupPassport } from './config/passport';
import passport from 'passport';


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
        return Math.min(2 ** retries * 100, 7000);
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
  setupPassport();
  const httpServer = createServer(app);
  app.use(passport.initialize());
  const redisClient = createSecureRedisClient();

  try {
    await redisClient.connect();
    await redisClient.ping();
    console.log('Redis connection test successful');

    // Initialize session store
    const RedisStore = connectRedis.default(session);
    const sessionStore = new RedisStore({
      client: redisClient as any,
      prefix: "aviator:"
    });

    app.use(express.json());
    app.use(cors(
      {
        origin:"*",
      }
    ));
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


    app.use('/api', router);
    app.use('/pay', paymentRouter)
    app.use((req, res, next) => {
      console.log('Request Headers:', req.headers);
      console.log('Authentication Header:', req.    headers.authorization);
      next();
    });

    // WebSocket server setup
    const wss = new WebSocketServer({ server: httpServer });
    handleWebSocketConnection(wss, redisClient as RedisClientType);

    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    //db connection
    const connectionStatus = await databaseService.testConnection();
    console.log(connectionStatus.message);
    const stats = await databaseService.getDatabaseStats();
    console.log('Database Stats:', stats);

    const PORT = process.env.PORT || 7000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
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

initializeServer().catch(error => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});
