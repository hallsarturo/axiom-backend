import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import {
    createUser,
    findUserByUsername,
    findUserById,
    validateUniqueFields,
} from '../user/model.js';
import rateLimit from 'express-rate-limit';
import { createVerification, verificationCheck } from '../lib/twilio.js';
import {
    createPendingUser,
    findPendingUserByUsername,
    removePendingUser,
} from '../user/model.js';

const router = Router();

// Configuring Passport-JWT
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
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
        await validateUniqueFields(userData);

        // Send 2F sms verification code to client via Twilio
        await createVerification(mobilePhone);

        // Store in pending_signups
        await createPendingUser(userData);

        res.status(200).json({
            message:
                'Verification code sent to sms. Please enter the code to complete signUp ',
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const userData = req.body;
        console.log('Data: ', userData);
        const pendingUser = await findPendingUserByUsername(userData.username);
        if (!pendingUser) {
            return res
                .status(400)
                .json({ error: 'No pending signup found for this username' });
        }

        // validate verification code with Twilio
        const verificationResult = await verificationCheck(
            userData.verificationCode,
            userData.mobilePhone
        );
        switch (verificationResult.status) {
            case 'approved':
                // Create new user
                const newUser = await createUser(userData);
                // Remove pending user
                await removePendingUser(pendingUser.id);
                // create JWT
                const token = jwt.sign(
                    {
                        id: newUser.id,
                        username: newUser.username,
                    },
                    'secret',
                    { expiresIn: '1h' }
                );
                return res.json({
                    token,
                    user: newUser,
                    essage: 'Signup complete',
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
    } catch (err) {}
});

passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
        const user = await findUserById(jwt_payload.id);
        if (!user) return done(null, false);
        return done(null, user);
    })
);

export { router };
