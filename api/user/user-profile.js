import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import { uploadProfileImage } from '../../lib/upload.js';
import authenticate from '../../lib/authenticate.js';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * @swagger
 * /api/user/profile/picture:
 *   post:
 *     summary: Upload or update user profile picture
 *     description: Uploads a new profile image for the authenticated user. The image is saved and its relative path is stored in the userProfilePic column. Only one image per user is allowed; new uploads overwrite the previous image.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload.
 *     responses:
 *       200:
 *         description: Image upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profileUrl:
 *                   type: string
 *                   description: Relative path to the uploaded profile image
 *       401:
 *         description: Unauthorized or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Upload failed
 */

router.post(
    '/profile/picture',
    authenticate,
    uploadProfileImage.single('file'),
    async (req, res) => {
        try {
            // Save relative path
            const fileUrl = `/uploads/profile-images/${req.file.filename}`;

            // Overwrite old photo: update userProfilePic in users table
            await db.users.update(
                { userProfilePic: fileUrl },
                { where: { id: req.userId } }
            );

            res.status(200).json({
                message: 'Image upload successful',
                profileUrl: fileUrl,
            });
        } catch (err) {
            console.error('Profile image upload error:', err);
            res.status(500).json({ error: 'Upload failed' });
        }
    }
);

/**
 * @swagger
 * /api/user/preferences:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user preferences
 *     description: Updates the authenticated user's preferences, including about, degree level, and preferred categories. Replaces all previous category preferences.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               about:
 *                 type: string
 *                 description: User's about/bio text
 *               degreeLevel:
 *                 type: integer
 *                 description: Degree level ID
 *               categories:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Failed to update preferences
 */

router.put('/preferences', authenticate, async (req, res) => {
    try {
        // Get data from request body
        console.log('req.body: ', req.body);
        const { about, degreeLevel, categories } = req.body;
        console.log('categories: ', categories);
        // Update 'about' in users table
        await db.users.update({ about }, { where: { id: req.userId } });

        // Save degreeLevelId in user_preferences (single record per user)
        await db.user_preferences.upsert({
            userId: req.userId,
            degreeLevelId: degreeLevel,
        });

        // Replace all categories for user in user_category_preferences
        if (Array.isArray(categories)) {
            // Remove old preferences
            await db.user_category_preferences.destroy({
                where: { userId: req.userId },
            });
            // Add new preferences
            for (const categoryId of categories) {
                await db.user_category_preferences.create({
                    userId: req.userId,
                    categoryId,
                });
            }
        }

        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile, including displayName, photoUrl, about, degree level, and preferred categories if available.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     id:
 *                       type: integer
 *                     displayName:
 *                       type: string
 *                     photoUrl:
 *                       type: string
 *                     about:
 *                       type: string
 *                     userProfilePic:
 *                       type: string
 *                       nullable: true
 *                       description: Relative path to the uploaded profile image, or null if not set
 *                     degreeLevel:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         imgSrc:
 *                           type: string
 *                         imgAlt:
 *                           type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized or invalid token
 *       404:
 *         description: User not found
 */

router.use('/', async (req, res) => {
    // logging debug
    // console.log('Headers:', req.headers);
    // console.log('Cookies:', req.cookies);
    // console.log('Body:', req.body);

    // Check user authorization
    let token;
    if (process.env.NODE_ENV === 'production') {
        // In production, extract token from cookie
        token = req.cookies.token;
    } else {
        // In development, extract token from Authorization header (sent from localStorage)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
            // console.log('token: ', token);
        } else {
            // console.log('entered cookies ');
            token = req.cookies.token; // fallback if sent as cookie
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Decode token and extract user id
    let payload;
    try {
        payload = jwt.verify(token, 'secret');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user by id
    const user = await db.users.findUserById({ id: payload.id });
    // console.log('user: ', user);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if user exists in auth_providers
    const provider = await db.auth_providers.findOne({
        where: { userId: user.id },
    });

    // Add user's degree level
    let degreeLevel = null;
    const userPref = await db.user_preferences.findOne({
        where: { userId: user.id },
        include: [
            {
                model: db.degree_levels,
                attributes: ['id', 'name', 'imgSrc', 'imgAlt'],
            },
        ],
    });
    if (userPref && userPref.degree_level) {
        degreeLevel = {
            id: userPref.degree_level.id,
            name: userPref.degree_level.name,
            imgSrc: userPref.degree_level.imgSrc,
            imgAlt: userPref.degree_level.imgAlt,
        };
    }

    // Add User's category preferences
    const categoryPrefs = await db.user_category_preferences.findAll({
        where: { userId: user.id },
        include: [{ model: db.categories, attributes: ['id', 'name'] }],
    });
    const categories = categoryPrefs.map((pref) => ({
        id: pref.category?.id,
        name: pref.category?.name,
    }));

    console.log('categories: ', categories)
    
    let responseUser = {
        username: user.username,
        id: user.id,
        about:
            user.about && user.about.trim() !== '' ? String(user.about) : null,
        degreeLevel,
        categories,
        userProfilePic: user.userProfilePic || null,
    };
    if (provider) {
        responseUser.displayName = provider.displayName;
        responseUser.photoUrl = user.userProfilePic
            ? user.userProfilePic
            : provider.photoUrl;
        responseUser.username = provider.displayName
            ? provider.displayName
            : user.username;
    }
    res.status(200).json({ user: responseUser });
});

export { router };
