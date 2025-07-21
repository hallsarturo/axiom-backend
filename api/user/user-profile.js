import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';

const router = Router();

router.use('/', async (req, res) => {
    // logging debug
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Body:', req.body);

    let token;
    if (process.env.NODE_ENV === 'production') {
        // In production, extract token from cookie
        token = req.cookies.token;
    } else {
        // In development, extract token from Authorization header (sent from localStorage)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
            console.log('token: ', token);
        } else {
            console.log('entered cookies ');
            token = req.cookies.token; // fallback if sent as cookie
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Decode token and extract user id
    let payload;
    try {
        payload = jwt.verify(token, 'secret');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user by id
    const user = await db.users.findUserById({ id: payload.id });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if user exists in auth_providers
    const provider = await db.auth_providers.findOne({
        where: { userId: user.id },
    });

    let responseUser = {
        username: user.username,
    };

    if (provider) {
        responseUser.displayName = provider.displayName;
        responseUser.photoUrl = provider.photoUrl;
        // Replace username with displayName if available
        responseUser.username = provider.displayName || user.username;
    }

    res.status(200).json({ user: responseUser });
});

export { router };
