import { Router } from 'express';
import jwt from 'jsonwebtoken';

import { createUser, findUserByUsername, findUserById } from '../user/model.js';

const router = Router();

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    const user = await findUserByUsername({ username, password });

    if (user === 0) {
        // No user found. Redirect to Signup
        return res
            .status(401)
            .json({ message: `no username '${username}' found.` });
    } else if (user === 2) {
        return res.status(401).json({ message: 'incorrect password' });
    } else {
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
    }
});

export { router };
