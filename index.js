import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import fs from 'node:fs';
import path from 'path';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import { router as userRouter } from './user/index.js';
import { router as loginRouter } from './auth/auth.js';

const app = express();
const port = 3000;
const securePort = 3010;
const _log_dirname = '/Users/proal-mac/Code/node/philo-net-1/';

// MIDDLEWARE
// Logging:
const accessLogStream = fs.createWriteStream(
    path.join(_log_dirname, 'access.log'),
    { flags: 'a' }
);
app.use(morgan('tiny', { stream: accessLogStream }));
// JSON Parse
app.use(express.json());
//
// Block non secure requests (proal)
function requireHTTPS(req, res, next) {
    if (req.secure) {
        return next();
    }
    res.status(403).send('HTTPS Required');
}
app.use(requireHTTPS);
//Express-session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true}
}))
//

// ROUTES
app.get('/', (req, resp) => {
    resp.send('Hello User');
});
app.use('/login', loginRouter);
app.get('/user', userRouter);
//

// Load SSL Certificates
const options = {
    key: fs.readFileSync('./certificates/localhost-key.pem'),
    cert: fs.readFileSync('./certificates/localhost.pem'),
    allowHTTP1: true,
};
//

// Create HTTP/2 server
const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);
httpServer.on('error', (err) => console.error(err));

httpServer.listen(port, () => {
    console.log(`Server ready HTTP, app listening on port ${port}`);
});
httpsServer.listen(securePort, () => {
    console.log(`Server ready HTTPS, app listening on port ${securePort}`);
});
