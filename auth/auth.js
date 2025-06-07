import { Router } from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { get } from '../user/model.js';

const router = Router();

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await get({ username, password });
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username or password',
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
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
            return res.status(401).send("there's no user");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.send('Loggin succesfull', user);
        });
    })(req, res, next);
});

export { router };
