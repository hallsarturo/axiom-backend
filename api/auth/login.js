import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../../models/index.js';
import logger from '../../lib/winston.js';

const router = Router();

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - Auth
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token (development only)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     mobilePhone:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.post('/', async (req, res) => {
    try {
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
                    return res
                        .status(401)
                        .json({ message: 'incorrect password' });
                }
                const token = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '30d' }
                );
                logger.log('info', 'token generated: ', token);
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    domain: '.axiomlab.space',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
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
                return res.status(401).json({
                    message:
                        'This account does not support password login. Please use Google or set a password.',
                });
            }
        }
    } catch (err) {
        logger.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export { router };
