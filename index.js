import './lib/env-config.js';
import {
    frontendUrl,
    jwtSecret,
    sessionCookieDomain,
    jwtIssuer,
    jwtAudience,
} from './lib/env-config.js';
import './instrument.js';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import logger from './lib/winston.js';
import session from 'express-session';
import * as rfs from 'rotating-file-stream';
import fs from 'node:fs';
import path from 'path';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import cors from 'cors';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import db from './models/index.js';
import { router as healthRouter } from './api/health/health.js';
import { router as logoutRouter } from './api/auth/logout.js';
import { router as loginRouter } from './api/auth/login.js';
import { router as signupRouter } from './api/auth/signup.js';
import { router as authRouter } from './api/auth/auth.js';
import { router as userProfileRouter } from './api/user/user-profile.js';
import { router as userFollowersRouter } from './api/user/followers.js';
import { router as userFollowingsRouter } from './api/user/followings.js';
import { router as dashboardRouter } from './api/dashboard/dashboard.js';
import { router as postsRouter } from './api/posts/posts.js';
import { router as commentsRouter } from './api/comments/comments.js';
import { router as searchRouter } from './api/search/search.js';
import { router as notificationsRouter } from './api/notifications/notifications.js';
import { router as chatRouter } from './api/chat/chat.js';
import Sequelize from 'sequelize';
import helmet from 'helmet';
import './api/auth/auth.js';
import config from './config/config.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import initWebsocket from './lib/websocket-server.js';

const app = express();

// logger.error('Test error log: Winston is Working!')

// SENTRY controllers
app.get('/', function rootHandler(req, res) {
    res.end('Hello world!');
});
Sentry.setupExpressErrorHandler(app);
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});

// app.get('/debug-sentry', function mainHandler(req, res) {
// Send a log before throwing the error
//     Sentry.logger.info('User triggered test error', {
//         action: 'test_error_endpoint',
//     });
//     throw new Error('My first Sentry error!');
// });
// end Sentry controllers

const port = 4000;
const securePort = 4010;
const _log_dirname =
    '/Users/proal-mac/Code/AxiomLabs/Axiom/back/axiom-backend/';

console.log('reached point 1');
console.log('NODE_ENV:', process.env.NODE_ENV);
// Test db connection
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
let sequelize;
if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        dbConfig
    );
}
(async () => {
    try {
        await sequelize.authenticate();
        console.log(
            'Connection to PostgreSQL has been established successfully'
        );
    } catch (err) {
        logger.error('Unable to connect to PostgreSQL:', err);
        process.exit(1); // Optionally exit if DB is not available
    }
})();

console.log('reached point 2');
// MIDDLEWARE
// Logging:
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: path.join(process.cwd(), 'log'),
    maxFiles: 7,
    size: '10M', // rotate after 10MB
    compress: 'gzip',
});
app.use(
    morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    })
);

// JSON Parse
app.use(express.json());
//
// Block non secure requests
function requireHTTPS(req, res, next) {
    // Allow requests from localhost and those forwarded as HTTPS by Nginx
    const isLocal =
        req.ip === '127.0.0.1' ||
        req.ip === '::1' ||
        req.hostname === 'localhost';
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (isLocal || isSecure) {
        return next();
    }
    res.status(403).send('HTTPS Required');
}
console.log('reached point 3');
app.set('trust proxy', 1);

// app.use(requireHTTPS);

// CORS
app.use(
    cors({
        origin: frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
// cookie Parser
app.use(cookieParser());

// Express-session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            domain: sessionCookieDomain,
        },
    })
);
// Serialize user to session (store user id)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session (fetch user by id)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.users.findUserById({ id });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.use(passport.initialize());
app.use(passport.session());

// PASSPORT-JWT
let opts = {};
opts.jwtFromRequest = (req) => req?.cookies?.token || null; // Extract token from cookie
opts.secretOrKey = jwtSecret;
opts.issuer = jwtIssuer;
opts.audience = jwtAudience;

// helmet
app.use(helmet());

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add this headers middleware before your routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// END Middleware

// ROUTES

// Debuging login (remove)
// Add to your backend Express app
// app.get('/api/verify-auth', (req, res) => {
//     let token = req.cookies.token;
//     if (!token) {
//         return res.status(401).json({
//             authenticated: false,
//             message: 'Not authenticated',
//         });
//     }

//     try {
//         const payload = jwt.verify(token, process.env.JWT_SECRET);
//         return res.status(200).json({
//             authenticated: true,
//             user: { id: payload.id, username: payload.username },
//         });
//     } catch (err) {
//         return res.status(401).json({
//             authenticated: false,
//             message: 'Invalid token',
//         });
//     }
// });

app.use('/api/health', healthRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/login', loginRouter);
app.use('/api/signup', signupRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/user/followers', userFollowersRouter);
app.use('/api/user/following', userFollowingsRouter);
app.use('/api/user', userProfileRouter);
app.use(
    '/uploads',
    (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    },
    express.static(path.join(process.cwd(), 'public', 'uploads'))
);
app.use('/api/search', searchRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chat', chatRouter);

//

// Load SSL Certificates
const options =
    process.env.NODE_ENV === 'production'
        ? {
              key: fs.readFileSync(
                  '/etc/letsencrypt/live/api.axiomlab.space/privkey.pem'
              ),
              cert: fs.readFileSync(
                  '/etc/letsencrypt/live/api.axiomlab.space/fullchain.pem'
              ),
              allowHTTP1: true,
          }
        : {
              key: fs.readFileSync('./certificates/localhost-key.pem'),
              cert: fs.readFileSync('./certificates/localhost.pem'),
              allowHTTP1: true,
          };
//

// Create HTTP/ server
const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);
httpServer.on('error', (err) => console.error(err));

// Initialize Websocket with the HTTPS server
const wsService = initWebsocket(httpsServer);
logger.info('WebSocket service initialized:', !!wsService);

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server ready HTTP, app listening on port ${port}`);
});

// Export the WebSocket service for use in other parts of the application
export { wsService };

httpsServer.listen(securePort, '0.0.0.0', () => {
    console.log(`Server ready HTTPS, app listening on port ${securePort}`);
});
