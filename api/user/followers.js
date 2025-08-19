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
 *     description: Returns a list of users who follow the specified user, along with the total count.
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
                    attributes: ['id', 'username'],
                },
            ],
        });
        res.json({
            followers: followers.map((f) => f.follower),
            totalFollowers: followers.length,
        });
         console.log(
            'Followers:',
            followers.map((f) => f.following)
        );
        console.log('TotalFollowers:', followers.length);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

/**
 * @swagger
 * /api/user/followers/{userId}/following:
 *   get:
 *     tags:
 *       - Followers
 *     summary: Get users this user is following
 *     description: Returns a list of users that the specified user is following, along with the total count.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose following list to fetch
 *     responses:
 *       200:
 *         description: List of users being followed and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 following:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                 totalFollowins:
 *                   type: integer
 *                   description: Total number of users being followed
 */

// GET: Get users this user is following
router.get('/:userId/following', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const following = await db.user_followers.findAll({
            where: { followerId: userId },
            include: [
                {
                    model: db.users,
                    as: 'following',
                    attributes: ['id', 'username'],
                },
            ],
        });

        res.json({
            following: following.map((f) => f.following),
            totalFollowings: following.length,
        });
        console.log(
            'Following:',
            following.map((f) => f.following)
        );
        console.log('TotalFollowings:', following.length);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch following' });
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
