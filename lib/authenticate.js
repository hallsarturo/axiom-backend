import jwt from 'jsonwebtoken'; // Make sure this is present
import db from '../models/index.js'; // Make sure this is present

// Middleware to extract user from token (reuse your logic)
export default async function authenticate(req, res, next) {
    //console.log('reached authenticate 1');
    let token;
    if (process.env.NODE_ENV === 'production') {
        token = req.cookies.token;
    } else {
        const authHeader = req.headers.authorization;
        //console.log('authHeader:', authHeader);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else {
            token = req.cookies.token;
        }
    }
    console.log('token:', token);
    if (!token) {
        //console.log('No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const payload = jwt.verify(token, 'secret');
        //console.log('payload:', payload);
        const user = await db.users.findUserById({ id: payload.id });
        //console.log('user: ', user);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        //console.log('reached authenticate 2');
        req.userId = payload.id;
        //console.log('\nauthenticate, re,userId: ', req.userId, '\n');
        next();
        //console.log('reached authenticate 3');
    } catch (err) {
        console.error('JWT error:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
