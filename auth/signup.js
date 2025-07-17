import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import {
    createUser,
    findPendingUserById,
    findUserById,
    validateUniqueFields,
    createPendingUser,
    removePendingUser,
} from '../user/model.js';
import rateLimit from 'express-rate-limit';
import { createVerification, verificationCheck } from '../lib/twilio.js';

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
        const provisionalUser = await createPendingUser(userData);

        // Save Data to token
        // create JWT
        const provisionalToken = jwt.sign(
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
        res.status(200).json({
            provisionalToken: provisionalToken,
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
        console.log('Entered to /verify call');

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided.' });
        }
        const token = authHeader.split(' ')[1];

        // Verify and decode token
        let userData;
        try {
            userData = jwt.verify(token, 'secret');
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        // Get OTP code from body
        const { otpSignup: otpCode } = req.body;
        if (!userData) {
            return res
                .status(400)
                .json({ error: 'No signup data found in token.' });
        }

        console.log('Data: ', userData, ' otpCode: ', otpCode);

        const pendingUser = await findPendingUserById(userData.id);
        if (!pendingUser) {
            return res
                .status(400)
                .json({ error: 'No pending signup found for this username' });
        }

        // validate verification code with Twilio
        const verificationResult = await verificationCheck(
            otpCode,
            userData.mobilePhone
        );
        // let verificationResult;
        // if (otpCode === '123456') {
        //     verificationResult = { status: 'approved' };
        // } else {
        //     verificationResult = { status: 'pending' };
        // }
        switch (verificationResult.status) {
            case 'approved':
                // Create new user
                const newUser = await createUser(userData);
                // Remove pending user
                await removePendingUser(pendingUser);
                // create JWT
                const token = jwt.sign(
                    {
                        id: newUser.id,
                        username: newUser.username,
                        verified: true,
                    },
                    'secret',
                    { expiresIn: '10h' }
                );
                return res.status(200).json({
                    token,
                    user: newUser,
                    Message: 'Signup complete',
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

passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
        const user = await findUserById(jwt_payload.id);
        if (!user) return done(null, false);
        return done(null, user);
    })
);

export { router };
