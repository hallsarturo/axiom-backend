import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { createUser, findUserByUsername, findUserById } from '../user/model.js';

const router = Router();

// Configuring Passport-JWT
let opt = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
// PRO: Review security

router.post('/', async (req, res) => {
    const { username, email, mobilePhone, password } = req.body;
    const user = await findUserByUsername(username, password);

    if (user === 0) {
        // Create new user
        

    } else {
        // User already exists, try to Sign In
        res.status(401).json({
            message: `User '${username}' already exists, try logging in instead`,
        });
    }
});
