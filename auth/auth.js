import { Router } from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OrcidStrategy } from 'passport-orcid';
import {
    findUserByEmail,
    findUserById,
    upsertAuthProvider,
} from '../user/model.js';

dotenv.config();

const router = Router();

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
            callbackURL: '/auth/google/callback',
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

                const user = await findUserByEmail(email);

                if (!user) {
                    // create user in Users table
                    user = await createUser({
                        username: profile.displayName
                            .replace(/\s+/g, '')
                            .toLowerCase(),
                        email,
                        password: null, // or a random string, since Google users don't need a password
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
                await upsertAuthProvider(providerData);
                console.log('Created new user from Google profile');

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

// Serialize user to session (store user id)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session (fetch user by id)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById({ id });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// redirect
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/signup`,
    }),
    async function (req, res) {
        // create JWT
        const token = jwt.sign(
            {
                id: req.user.id,
                username: req.user.username,
                verified: true,
            },
            'secret',
            { expiresIn: '10h' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
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
