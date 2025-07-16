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
import { createVerification, createVerificationCheck } from '../lib/twilio.js';

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
        console.log('userData: ', userData);

        // Validate unique fields
        await validateUniqueFields(userData);

        // 2F verification via sms with Twilio
        createVerification()

        // Create new user
        const newUser = await createUser(userData);
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
            },
            'secret',
            { expiresIn: '1h' }
        );
        return res.json({ token, user: newUser });
    } catch (err) {
        console.error('Signup error:', err.message);
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
