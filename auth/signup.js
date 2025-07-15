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

const router = Router();

// Configuring Passport-JWT
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
// PRO: Review security

router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        console.log('userData: ', userData);

        // Validate unique fields
        const user = await validateUniqueFields(userData);

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
