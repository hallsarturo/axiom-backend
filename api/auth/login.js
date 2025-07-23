import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.users.findUserByUsername({ username, password });

    if (user === 0) {
        return res
            .status(401)
            .json({ message: `no username '${username}' found.` });
    } else if (user === 2) {
        return res.status(401).json({ message: 'incorrect password' });
    } else {
        if (
            user &&
            user.password &&
            user.password.length > 0 &&
            user.password !== 'randomstring'
        ) {
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'incorrect password' });
            }
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                },
                'secret',
                { expiresIn: '1h' }
            );
            if (process.env.NODE_ENV === 'production') {
                // Send JWT as httpOnly cookie in production
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    path: '/',
                    maxAge: 60 * 60 * 1000, // 1 hour
                })
                    .status(200)
                    .json({
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            mobilePhone: user.mobilePhone,
                            isVerified: user.isVerified,
                        },
                        message: 'Login successful',
                    });
            } else {
                // Send JWT in response body in development
                res.status(200).json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        mobilePhone: user.mobilePhone,
                        isVerified: user.isVerified,
                    },
                    message: 'Login successful',
                });
            }
        } else {
            return res.status(401).json({
                message:
                    'This account does not support password login. Please use Google or set a password.',
            });
        }
    }
});

export { router };
