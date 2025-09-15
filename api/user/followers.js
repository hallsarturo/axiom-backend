import { Router } from 'express';
import db from '../../models/index.js';
import authenticate from '../../lib/authenticate.js';

const router = Router();

/**
 * @swagger
 * /api/user/followers/{userId}:
 *   get:
 *     tags:
 *       - Followers
 *     summary: Get followers of a user
 *     description: Returns a list of users who follow the specified user, including profile info from users and authProviders tables.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose followers to fetch
 *     responses:
 *       200:
 *         description: List of followers and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       userProfilePic:
 *                         type: string
 *                         nullable: true
 *                       photoUrl:
 *                         type: string
 *                         nullable: true
 *                       displayName:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         nullable: true
 *                 totalFollowers:
 *                   type: integer
 *                   description: Total number of followers
 */

// GET: Get followers of a user
router.get('/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const followers = await db.user_followers.findAll({
            where: { followingId: userId },
            include: [
                {
                    model: db.users,
                    as: 'follower',
                    attributes: [
                        'id',
                        'username',
                        'userProfilePic',
                        'createdAt',
                    ],
                },
            ],
        });

        // Enrich with photoUrl and displayName from authProviders
        const enrichedFollowers = await Promise.all(
            followers.map(async (f) => {
                const follower = f.follower?.toJSON?.() || f.follower || {};
                const provider = await db.auth_providers.findOne({
                    where: { userId: follower.id },
                    attributes: ['photoUrl', 'displayName'],
                });
                return {
                    ...follower,
                    photoUrl: provider?.photoUrl || null,
                    displayName: provider?.displayName || null,
                };
            })
        );

        res.json({
            followers: enrichedFollowers,
            totalFollowers: followers.length,
        });
        // console.log('Followers:', enrichedFollowers);
        // console.log('TotalFollowers:', followers.length);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

/**
 * @swagger
 * /api/user/followers/{targetUserId}:
 *   put:
 *     tags:
 *       - Followers
 *     summary: Follow or unfollow a user
 *     description: Authenticated user can follow or unfollow another user. If already following, unfollows; otherwise, follows.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to follow or unfollow
 *     responses:
 *       200:
 *         description: Unfollowed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       201:
 *         description: Followed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot follow yourself
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// PUT: Follow/unfollow a user
router.put('/:targetUserId', authenticate, async (req, res) => {
    try {
        const followerId = req.userId;
        const followingId = Number(req.params.targetUserId);

        if (followerId === followingId) {
            return res
                .status(400)
                .json({ error: "You can't follow yourself." });
        }

        // Check if already following
        const existing = await db.user_followers.findOne({
            where: { followerId, followingId },
        });

        if (existing) {
            await existing.destroy();
            return res.status(200).json({ message: 'Unfollowed user.' });
        } else {
            await db.user_followers.create({ followerId, followingId });
            return res.status(201).json({ message: 'Followed user.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to follow/unfollow user' });
    }
});

export { router };
