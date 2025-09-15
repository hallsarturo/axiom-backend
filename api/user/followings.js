import { Router } from 'express';
import db from '../../models/index.js';
import authenticate from '../../lib/authenticate.js';

const router = Router();

/**
 * @swagger
 * /api/user/following/{userId}:
 *   get:
 *     tags:
 *       - Following
 *     summary: Get users this user is following
 *     description: Returns a list of users that the specified user is following, including profile info from users and authProviders tables, along with the total count.
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
 *                 totalFollowings:
 *                   type: integer
 *                   description: Total number of users being followed
 */

// GET: Get users this user is following
router.get('/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const following = await db.user_followers.findAll({
            where: { followerId: userId },
            include: [
                {
                    model: db.users,
                    as: 'following',
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
        const enrichedFollowing = await Promise.all(
            following.map(async (f) => {
                const followedUser =
                    f.following?.toJSON?.() || f.following || {};
                const provider = await db.auth_providers.findOne({
                    where: { userId: followedUser.id },
                    attributes: ['photoUrl', 'displayName'],
                });
                return {
                    ...followedUser,
                    photoUrl: provider?.photoUrl || null,
                    displayName: provider?.displayName || null,
                };
            })
        );

        res.json({
            following: enrichedFollowing,
            totalFollowings: following.length,
        });
        // console.log(
        //     'Following:',
        //     following.map((f) => f.following)
        // );
        // console.log('TotalFollowings:', following.length);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

export { router };
