import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile, including displayName and photoUrl if available.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     id:
 *                       type: integer    
 *                     displayName:
 *                       type: string
 *                     photoUrl:
 *                       type: string
 *       401:
 *         description: Unauthorized or invalid token
 *       404:
 *         description: User not found
 */

router.use('/', async (req, res) => {
    // logging debug
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Body:', req.body);

    // Check user authorization
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
    console.log('user: ', user);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if user exists in auth_providers
    const provider = await db.auth_providers.findOne({
        where: { userId: user.id },
    });

    let responseUser = {
        username: user.username,
        id: user.id,
    };

    if (provider) {
        responseUser.displayName = provider.displayName;
        responseUser.photoUrl = provider.photoUrl;
        // Replace username with displayName if available
        responseUser.username = provider.displayName || user.username;
    }
    console.log('responseUSer: ', responseUser);
    res.status(200).json({ user: responseUser });
});

export { router };
