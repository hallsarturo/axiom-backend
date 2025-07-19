import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';

import db from '../../models/index.js';
import rateLimit from 'express-rate-limit';
import { createVerification, verificationCheck } from '../../lib/twilio.js';

const router = Router();

// PRO: Review security, activate signupLimiter

const signupLimiter = rateLimit({
    // ACTIVATE IN PRO
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many signup attempts, please try again later.' },
});

router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        const mobilePhone = userData.mobilePhone;
        console.log('userData: ', userData);

        // Validate unique fields
        await db.users.validateUniqueFields(userData);

        // Send 2F sms verification code to client via Twilio
        // await createVerification(mobilePhone);

        // Store in pending_signups
        const provisionalUser = await db.pending_signups.createPendingUser(userData);

        // Save Data to token
        // create JWT
        const prevToken = jwt.sign(
            {
                id: provisionalUser.id,
                username: provisionalUser.username,
                email: provisionalUser.email,
                mobilePhone: provisionalUser.mobilePhone,
                password: provisionalUser.password,
                verified: false,
            },
            'secret',
            { expiresIn: '15m' }
        );
        console.log('created token: ', prevToken);
        res.cookie('token', prevToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: 'localhost',
            maxAge: 10 * 60 * 60 * 1000, // 10 hours
        })
            .status(200)
            .json({
                message:
                    'Verification code sent to sms. Please enter the code to complete signUp ',
            });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// PASSPORT-JWT
let opts = {};
opts.jwtFromRequest = (req) => req?.cookies?.token || null; // Extract token from cookie
opts.secretOrKey = 'secret';
// opts.issuer = 'accoaccounts.examplesoft.com';
// opts.audience = 'yoursite.net';

passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
        const user = await db.users.findUserById(jwt_payload.id);
        if (!user) return done(null, false);
        return done(null, user);
    })
);

router.post('/verify', async (req, res) => {
    try {
        console.log('Entered to /verify call');

        // Try to get token from Authorization header OR cookie

        let prevToken = req.cookies.token;
        // if (authHeader && authHeader.startsWith('Bearer ')) {
        //     token = authHeader.split(' ')[1];
        // } else if (req.cookies && req.cookies.token) {
        //     token = req.cookies.token;
        // }

        if (!prevToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        // Verify and decode token
        let userData;
        try {
            userData = jwt.verify(prevToken, 'secret');
        } catch (err) {
            return res
                .status(401)
                .json({ error: 'Invalid or expired token.', err });
        }

        // Get OTP code from body
        const { otpSignup: otpCode } = req.body;
        if (!userData) {
            return res
                .status(400)
                .json({ error: 'No signup data found in token.' });
        }

        console.log('Data: ', userData, ' otpCode: ', otpCode);

        const pendingUser = await db.pending_signups.findPendingUserById(userData.id);
        if (!pendingUser) {
            return res
                .status(400)
                .json({ error: 'No pending signup found for this username' });
        }

        // validate verification code with Twilio
        // const verificationResult = await verificationCheck(
        //     otpCode,
        //     userData.mobilePhone
        // );
        const verificationResult = { status: 'approved' };

        switch (verificationResult.status) {
            case 'approved':
                // Create new user
                const newUser = await db.users.createUser(userData);
                // Remove pending user
                await db-pending_signups.removePendingUser(pendingUser);
                // create JWT
                const newToken = jwt.sign(
                    {
                        id: newUser.id,
                        username: newUser.username,
                        verified: true,
                    },
                    'secret',
                    { expiresIn: '10h' }
                );
                return res
                    .cookie('token', newToken, {
                        secure: true,
                        sameSite: 'none',
                        httpOnly: true,
                        maxAge: 10 * 60 * 60 * 1000, // 10 hours
                    })
                    .status(200)
                    .json({
                        user: newUser,
                        message: 'Signup complete',
                    });
            case 'pending':
                return res.status(400).json({
                    error: 'Verification code is incorrect or not yet approved.',
                });
            case 'canceled':
                return res.status(400).json({
                    error: 'Verification was canceled. Please restart signup.',
                });
            case 'max_attempts_reached':
                return res.status(400).json({
                    error: 'Maximum verification attempts reached. Please request a new code.',
                });
            case 'deleted':
                return res.status(400).json({
                    error: 'Verification was deleted. Please restart signup.',
                });
            case 'failed':
                return res.status(400).json({
                    error: 'Verification failed. Please request a new code.',
                });
            case 'expired':
                return res.status(400).json({
                    error: 'Verification code expired. Please request a new code.',
                });
            default:
                return res
                    .status(400)
                    .json({ error: 'Unknown verification status.' });
        }
    } catch (err) {
        console.error('Verify error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

export { router };
