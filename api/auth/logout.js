import { Router } from 'express';

const router = Router();

app.post('/api/logout', function (req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.axiomlab.space',
        path: '/',
    });
    res.status(200).json({ message: 'Logout successful' });
});

export { router };
