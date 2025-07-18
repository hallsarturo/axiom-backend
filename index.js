import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import fs from 'node:fs';
import path from 'path';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import cors from 'cors';
import passport from 'passport';
import { router as userRouter } from './user/index.js';
import { router as loginRouter } from './auth/login.js';
import { router as signupRouter } from './auth/signup.js';
import { router as authRouter } from './auth/auth.js';
import helmet from 'helmet';
import './auth/auth.js';

dotenv.config();
const app = express();
const port = 4000;
const securePort = 4010;
const _log_dirname = '/Users/proal-mac/Code/node/axiom-backend/';

// MIDDLEWARE
// Logging:
const accessLogStream = fs.createWriteStream(
    path.join(_log_dirname, 'access.log'),
    { flags: 'a' }
);
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
        methods: ['GET', 'POST'],
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
// helmet
app.use(helmet());


// end Middleware

// ROUTES
app.get('/', (req, resp) => {
    resp.send('Hello User');
});
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/auth', authRouter);
app.get('/user', userRouter);
app.get(
    '/profile',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        res.json({ user: req.user });
    }
);
app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
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
