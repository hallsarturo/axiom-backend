import jwt from 'jsonwebtoken'; // Make sure this is present
import db from '../models/index.js'; // Make sure this is present
import logger from './winston.js';

// Middleware to extract user from token (reuse your logic)
export default async function authenticate(req, res, next) {
    //logger.log('reached authenticate 1');
    let token;
    if (process.env.NODE_ENV === 'production') {
        token = req.cookies.token;
    } else {
        const authHeader = req.headers.authorization;
        //logger.log('authHeader:', authHeader);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else {
            token = req.cookies.token;
        }
    }
    logger.log('token:', token);
    if (!token) {
        logger.error('No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        //logger.log('payload:', payload);
        const user = await db.users.findUserById({ id: payload.id });
        //logger.log('user: ', user);
        if (!user) {
            logger.error('User not found for token payload:', payload);
            return res.status(401).json({ error: 'User not found' });
        }
        //logger.log('reached authenticate 2');
        req.userId = user.id;
        req.user = user;
        //logger.log('\nauthenticate, re,userId: ', req.userId, '\n');
        next();
        //logger.log('reached authenticate 3');
    } catch (err) {
        logger.error('JWT verification failed:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
