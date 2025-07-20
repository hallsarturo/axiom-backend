import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import db from '../../models/index.js';

const router = Router();

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.users.findUserByUsername({ username, password });

    if (user === 0) {
        // No user found. Redirect to Signup
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
            if (process.env.NODE_ENV !== 'production') {
                console.log('Token: ', token);
            }
            // Set JWT as httpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 1000, // 1 hour
            })
                .status(200)
                .json({ user, message: 'Login successful' });
        } else {
            return res
                .status(401)
                .json({
                    message:
                        'This account does not support password login. Please use Google or set a password.',
                });
        }
    }
});

export { router };
