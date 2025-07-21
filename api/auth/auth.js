import { Router } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OrcidStrategy } from 'passport-orcid';
import db from '../../models/index.js';

dotenv.config();

const router = Router();

// JWT
let opts = {};
opts.jwtFromRequest = (req) => req?.cookies?.token || null; // Extract token from cookie
opts.secretOrKey = 'secret';
// opts.issuer = 'accoaccounts.examplesoft.com';
// opts.audience = 'yoursite.net';

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['token'];
                    }
                    return token;
                },
            ]),
            secretOrKey: 'secret',
        },
        async (jwtPayload, done) => {
            // Your verification logic
            try {
                console.log('JWT payload:', jwtPayload); // Debug
                const user = await db.users.findUserById({ id: jwtPayload.id });
                if (!user) {
                    console.log('No user found for id:', jwtPayload.id); // Debug
                    return done(null, false);
                }
                return done(null, user);
            } catch (err) {
                console.error('JWT strategy error:', err);
                return done(err, false);
            }
        }
    )
);

// passport.use(
//     new JwtStrategy(opts, async function (jwt_payload, done) {
//         try {
//             console.log('JWT payload:', jwt_payload); // Debug
//             const user = await db.users.findUserById({ id: jwt_payload.id });
//             if (!user) {
//                 console.log('No user found for id:', jwt_payload.id); // Debug
//                 return done(null, false);
//             }
//             return done(null, user);
//         } catch (err) {
//             console.error('JWT strategy error:', err);
//             return done(err, false);
//         }
//     })
// );

// GOOOGLE

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
        },

        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log('profile: ', profile);

                // Use the correct way to get email from Google profile
                const email =
                    profile.emails && profile.emails.length > 0
                        ? profile.emails[0].value
                        : null;
                if (!email) {
                    return done(
                        new Error('No email found in Google profile'),
                        null
                    );
                }

                let user = await db.users.findUserByEmail(email);

                if (!user) {
                    // create user in Users table
                    user = await db.users.createUser({
                        username: profile.displayName
                            .replace(/\s+/g, '')
                            .toLowerCase(),
                        email,
                        password: Math.random().toString(36).slice(-8), // random string
                        mobilePhone: null,
                    });
                }
                // Always ensure auth provider entry exists/updated
                const providerData = {
                    userId: user.id, // Use your local user id, not Google profile id
                    provider: 'google',
                    providerId: profile.id,
                    email: email,
                    displayName: profile.displayName,
                    familyName: profile.name?.familyName,
                    givenName: profile.name?.givenName,
                    photoUrl: profile.photos?.[0]?.value,
                };
                await db.auth_providers.upsertAuthProvider(providerData);
                console.log('Created new user from Google profile');

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);


// redirect
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/`,
    }),
    async function (req, res) {
        // Update isVerified to true
        await db.users.setVerified(req.user.id);

        // create JWT
        const token = jwt.sign(
            {
                id: req.user.id,
                username: req.user.username,
                isVerified: true,
            },
            'secret',
            { expiresIn: '10h' }
        );

        // Set JWT as httpOnly cookie and redirect
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // always true for HTTPS dev/prod
            sameSite: 'none', // required for cross-origin cookies
            maxAge: 10 * 60 * 60 * 1000, // 10 hours
        }).redirect(`${process.env.FRONTEND_URL}/auth/success`);
    }
);

// END GOOGLE CONFIG

// ORCID

// router.get('/auth/orcid', passport.authenticate('orcid'));

// passport.use(
//     new OrcidStrategy(
//         {
//             sandbox: process.env.NODE_ENV !== 'production', // use the sandbox for non-production environments
//             clientID: ORCID_CLIENT_ID,
//             clientSecret: ORCID_CLIENT_SECRET,
//             callbackURL: '/auth/orcid/callback',
//         },
//         function (accessToken, refreshToken, params, profile, done) {
//             // NOTE: `profile` is empty, use `params` instead
//             User.findOrCreate({ orcid: params.id }, function (err, user) {
//                 return done(err, user);
//             });
//         }
//     )
// );

// // redirect
// router.get(
//     '/auth/orcid/callback',
//     passport.authenticate('orcid', { failureRedirect: '/login' }),
//     function (req, res) {
//         // Successful authentication, redirect home.
//         res.redirect('/');
//     }
// );

// END ORCID CONFIG

export { router };
