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
opts.secretOrKey = process.env.JWT_SECRET;
// opts.issuer = 'accoaccounts.examplesoft.com';
// opts.audience = 'yoursite.net';

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: (req) => {
                console.log('Cookies:', req.cookies);
                const token = req.cookies?.token || null;
                console.log('Extracted token:', token ? 'Present' : 'Missing');
                return token;
            },
            secretOrKey: process.env.JWT_SECRET,
        },
        async (jwtPayload, done) => {
            try {
                console.log('JWT payload:', jwtPayload);
                // Your verification logic
                const user = await db.users.findUserById({ id: jwtPayload.id });
                if (!user) {
                    console.log('No user found for id:', jwtPayload.id); // Debug
                    return done(null, false);
                }
                return done(null, user);
            } catch (err) {
                console.error('JWT verification error:', err);
                return done(err, false);
            }
        }
    )
);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Google OAuth login
 *     description: Redirects user to Google for authentication.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */

// GOOOGLE
router.get(
    '/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'profile',
            'email',
        ],
        prompt: 'select_account',
    })
);
// router.get(
//     '/google',
//     passport.authenticate('google', { scope: ['profile', 'email'] })
// );

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
        },

        async (accessToken, refreshToken, profile, done) => {
            try {
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

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Google OAuth callback
 *     description: Handles Google OAuth callback, creates user if needed, and issues JWT.
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT (in cookie or query param)
 *       401:
 *         description: Authentication failed
 */

// redirect
router.get(
    '/google/callback',
    (req, res, next) => {
        passport.authenticate('google', {
            failureRedirect: `${process.env.FRONTEND_URL}/`,
        })(req, res, next);
    },
    async function (req, res) {
        try {
            // Make sure req.user exists
            if (!req.user || !req.user.id) {
                console.error('Missing user in Google callback');
                return res.redirect(
                    `${process.env.FRONTEND_URL}/login?error=authentication_failed`
                );
            }

            // Update isVerified to true
            await db.users.setVerified(req.user.id);

            // create JWT
            const token = jwt.sign(
                {
                    id: req.user.id,
                    username: req.user.username,
                    isVerified: true,
                },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            if (process.env.NODE_ENV === 'production') {
                // Set JWT as httpOnly cookie and redirect
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    domain: '.axiomlab.space',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
                });
                return res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
            } else {
                // Send JWT in response body for localStorage save in dev
                return res.redirect(
                    `${process.env.FRONTEND_URL}/auth/success?token=${token}`
                );
            }
        } catch (error) {
            console.error('Error in Google callback:', error);
            return res.redirect(
                `${process.env.FRONTEND_URL}/login?error=server_error`
            );
        }
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
