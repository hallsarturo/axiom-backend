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
// opts.issuer = 'accoaccounts.examplesoft.com';
// opts.audience = 'yoursite.net';

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    const user = await findUserByUsername(username, password);

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
        res.json({ token });
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
