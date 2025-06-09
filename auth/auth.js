import dotenv from 'dotenv';
import { Router } from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { get } from '../user/model.js';

const router = Router();

passport.use(
    new LocalStrategy(function verify(username, password, done) {
        get(username, password, (err, user, info) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, info); // info can be a message object
            }
            return done(null, user);
        });
    })
);

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

router.use(passport.initialize());
router.post('/', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res
                .status(401)
                .json({ message: info?.message || 'Unauthorized' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({ success: true });
        });
    })(req, res, next);
});

export { router };
