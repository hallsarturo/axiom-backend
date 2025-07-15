import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { createUser, findUserByUsername, findUserById } from '../user/model.js';

const router = Router();

// Configuring Passport-JWT
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
// PRO: Review security

router.post('/', async (req, res) => {
    const userData = req.body;
    console.log('userData: ', userData);
    const user = await findUserByUsername(userData);

    if (user === 0) {
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
        if (process.env.NODE_ENV !== 'production') {
            console.log('Token: ', token);
        }
        return res.json({ token });
    } else {
        // User already exists, try to Sign In
        res.status(401).json({
            message: `User '${userData.username}' already exists, try logging in instead`,
        });
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
