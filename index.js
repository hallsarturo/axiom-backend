import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
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
import { router as loginRouter } from './api/auth/login.js';
import { router as signupRouter } from './api/auth/signup.js';
import { router as authRouter } from './api/auth/auth.js';
import { router as userProfileRouter } from './api/user/user-profile.js';
import { router as dashboardRouter } from './api/dashboard/dashboard.js';
import { router as postsRouter } from './api/posts/posts.js';
import { router as searchRouter } from './api/search/search.js';
import Sequelize from 'sequelize';
import helmet from 'helmet';
import './api/auth/auth.js';
import config from './config/config.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

dotenv.config();
const app = express();
const port = 4000;
const securePort = 4010;
const _log_dirname =
    '/Users/proal-mac/Code/AxiomLabs/Axiom/back/axiom-backend/';

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
        console.error('Unable to connect to PostgreSQL:', err);
        process.exit(1); // Optionally exit if DB is not available
    }
})();

// MIDDLEWARE
// Logging:
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: path.join(process.cwd(), 'log'),
    maxFiles: 7,
    size: '10M', // rotate after 10MB
    compress: 'gzip',
});
app.use(morgan('combined', { stream: accessLogStream }));
// JSON Parse
app.use(express.json());
//
// Block non secure requests
function requireHTTPS(req, res, next) {
    if (req.secure) {
        return next();
    }
    res.status(403).send('HTTPS Required');
}
app.use(requireHTTPS);
// CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
//Express-session
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: true,
            maxAge: 15 * 60 * 1000,
            sameSite: 'none',
            httpOnly: true,
        },
    })
);
// cookie Parser
app.use(cookieParser());

app.use(passport.initialize());
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

//app.use(passport.session());

// PASSPORT-JWT
let opts = {};
opts.jwtFromRequest = (req) => req?.cookies?.token || null; // Extract token from cookie
opts.secretOrKey = 'secret';
// opts.issuer = 'accoaccounts.examplesoft.com';
// opts.audience = 'yoursite.net';

// helmet
app.use(helmet());

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// END Middleware

// ROUTES
app.use('/api/login', loginRouter);
app.use('/api/signup', signupRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/user', userProfileRouter);
app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'public', 'uploads'))
);
app.use('/api/search', searchRouter);
app.use('/api/posts', postsRouter);
app.post('/api/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        req.session.destroy((err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Error destroying session' });
            }
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Logout successful' });
        });
    });
});
//

// Load SSL Certificates
const options = {
    key: fs.readFileSync('./certificates/localhost-key.pem'),
    cert: fs.readFileSync('./certificates/localhost.pem'),
    allowHTTP1: true,
};
//

// Create HTTP/ server
const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);
httpServer.on('error', (err) => console.error(err));

// httpServer.listen(port, () => {
//     console.log(`Server ready HTTP, app listening on port ${port}`);
// });
httpsServer.listen(securePort, () => {
    console.log(`Server ready HTTPS, app listening on port ${securePort}`);
});
