import { Router } from 'express';

const router = Router();

router.post('/', function (req, res) {
    // Clear the cookie with EXACTLY the same parameters as when it was set
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Match your login cookie setting
        sameSite: 'none',
        domain: '.axiomlab.space', // Make sure this matches exactly how it was set
        path: '/',
    });

    // Also clear a potential non-httpOnly version
    res.clearCookie('token', {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        domain: '.axiomlab.space',
        path: '/',
    });

    // Clear potential alternative domain versions
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        domain: 'axiomlab.space', // Without the dot prefix
        path: '/',
    });

    res.status(200).json({ message: 'Logout successful' });
});

export { router };
