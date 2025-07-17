import { Router } from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findUserByEmail, createAuthProvider } from '../user/model.js';

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

                let user = await findUserByEmail(email);

                if (!user) {
                    // Optionally: create user in Users table
                    // user = await createUser({
                    //     username: profile.displayName
                    //         .replace(/\s+/g, '')
                    //         .toLowerCase(),
                    //     email,
                    //     password: null, // or a random string, since Google users don't need a password
                    // });
                    // Optionally: create entry in auth_providers table here
                    const data = {
                        userId: user.id, // Use your local user id, not Google profile id
                        provider: 'google',
                        providerId: profile.id,
                        email,
                        displayName: profile.displayName,
                        familyName: profile.name?.familyName,
                        givenName: profile.name?.givenName,
                        photoUrl: profile.photos?.[0]?.value,
                    };
                    await createAuthProvider(data);
                    console.log('Created new user from Google profile');
                }

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

//
// passport.use(
//     new JwtStrategy(opts, async function (jwt_payload, done) {
//         const user = await findUserById(jwt_payload.id);
//         if (!user) return done(null, false);
//         return done(null, user);
//     })
// );

// redirect
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/signup`,
    }),
    function (req, res) {
        const token = req.user.token; // Assuming the token is available on the user object
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    }
);

export { router };
