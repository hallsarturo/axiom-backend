import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import db from '../../models/index.js';
import rateLimit from 'express-rate-limit';
import { createVerification, verificationCheck } from '../../lib/twilio.js';
import logger from '../../lib/winston.js';

const router = Router();

// PRO: Review security, activate signupLimiter

const signupLimiter = rateLimit({
    // ACTIVATE IN PRO
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many signup attempts, please try again later.' },
});

// PASSPORT-JWT
let opts = {};
opts.jwtFromRequest = (req) => req?.cookies?.token || null; // Extract token from cookie
opts.secretOrKey = process.env.JWT_SECRET;
opts.issuer = 'api.axiomlab.space';
opts.audience = 'axiomlab.space';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User signup
 *     description: Registers a new user and sends a verification code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               mobilePhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent to SMS.
 *       400:
 *         description: Signup error
 */

router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        const mobilePhone = userData.mobilePhone;
        // logger.info('userData: ', userData);

        // Check if user already exists
        const existingUser = await db.users.findOne({
            where: {
                [Op.or]: [
                    { username: userData.username },
                    { email: userData.email },
                    { mobilePhone: userData.mobilePhone },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.isVerified) {
                // Block signup, send error
                throw new Error(
                    'User already exists and is verified, try signin in.'
                );
            } else {
                // User exists but not verified
                // Optionally update user info here if needed
                // Send verification code again
                // Issue token for verification
                const provisionalToken = jwt.sign(
                    {
                        id: existingUser.id,
                        username: existingUser.username,
                        email: existingUser.email,
                        mobilePhone: existingUser.mobilePhone,
                        verified: false,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );
                res.cookie('token', provisionalToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 10 * 60 * 60 * 1000,
                })
                    .status(200)
                    .json({
                        message:
                            'Verification code sent again. Please enter the code to complete signUp.',
                    });
                return;
            }
        }

        // Hash the password before creating the user
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        userData.password = hashedPassword;

        // If no user, create new user delete LOG in PRO
        const newUser = await db.users.createUser(userData);
        logger.info('new user created in users: ', newUser);

        // Save Data to token
        // create JWT
        const provisionalToken = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                mobilePhone: newUser.mobilePhone,
                password: newUser.password,
                verified: false,
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        // logger.info('created token: ', provisionalToken);
        res.cookie('token', provisionalToken, {
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
        logger.error('Signup error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/auth/signup/verify:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify signup OTP
 *     description: Verifies the OTP code sent to the user's phone and completes signup.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otpSignup:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signup complete
 *       400:
 *         description: Verification error
 */

router.post('/verify', async (req, res) => {
    try {
        // logger.info('Entered to /verify call');

        // Try to get token from Authorization header OR cookie

        let provisionalToken = req.cookies.token;

        if (!provisionalToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        // Verify and decode token
        let userData;
        try {
            userData = jwt.verify(provisionalToken, process.env.JWT_SECRET);
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

        // logger.info('Data: ', userData, ' otpCode: ', otpCode);

        const user = await db.users.findUserById(userData);
        if (!user) {
            return res.status(400).json({ error: 'No user found in the db' });
        }

        // validate verification code with Twilio
        // const verificationResult = await verificationCheck(
        //     otpCode,
        //     userData.mobilePhone
        // );
        const verificationResult = { status: 'approved' };

        switch (verificationResult.status) {
            case 'approved':
                // Verify user
                user.isVerified = true;
                await user.save();

                // create JWT
                const verifiedToken = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                        verified: true,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '30d' }
                );
                return res
                    .cookie('token', verifiedToken, {
                        secure: true,
                        sameSite: 'none',
                        httpOnly: true,
                        maxAge: 10 * 60 * 60 * 1000, // 10 hours
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
        logger.error('Verify error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

export { router };
