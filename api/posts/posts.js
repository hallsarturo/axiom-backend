import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/posts/papers:
 *   get:
 *     summary: Get all paper posts
 *     description: Retrieve all posts of type 'paper' with reaction and engagement statistics. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of paper posts with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paperPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       abstract:
 *                         type: string
 *                       content:
 *                         type: string
 *                       image:
 *                         type: string
 *                       identifier:
 *                         type: string
 *                       author:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       totalReactions:
 *                         type: integer
 *                       likes:
 *                         type: integer
 *                       dislikes:
 *                         type: integer
 *                       laughs:
 *                         type: integer
 *                       angers:
 *                         type: integer
 *                       comments:
 *                         type: integer
 *                       shares:
 *                         type: integer
 *       401:
 *         description: Unauthorized - JWT required
 *       500:
 *         description: Could not fetch posts
 */

router.get('/papers', async (req, res) => {
    try {
        // get all elements from posts type: paper
        const paperPosts = await db.posts.findAll({
            where: { type: 'paper' },
            order: [['createdAt', 'DESC']],
        });

        // For each post, get likes, dislikes, comments, shares
        const postsWithStats = await Promise.all(
            paperPosts.map(async (post) => {
                const likes = await db.post_reactions.count({
                    where: { postId: post.id, reaction: 'like' },
                });
                const dislikes = await db.post_reactions.count({
                    where: { postId: post.id, reaction: 'dislike' },
                });
                const laughs = await db.post_reactions.count({
                    where: { postId: post.id, reaction: 'laugh' },
                });
                const angers = await db.post_reactions.count({
                    where: { postId: post.id, reaction: 'anger' },
                });
                const comments = await db.post_comments.count({
                    where: { postId: post.id },
                });
                const shares = await db.post_shares.count({
                    where: { postId: post.id },
                });

                const totalReactions = await db.post_reactions.count({
                    where: { postId: post.id },
                });

                return {
                    ...post.toJSON(),
                    totalReactions,
                    likes,
                    dislikes,
                    laughs,
                    angers,
                    comments,
                    shares,
                };
            })
        );

        res.status(200).json({ paperPosts: postsWithStats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch posts' });
    }
});

router.put('/:postId/reaction', async (req, res) => {
    try {
        const { postId } = req.params;
        const { reaction } = req.body;
        const userId = req.user?.id; // Assumes user is authenticated and userId is available

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!['like', 'dislike', 'laugh', 'anger'].includes(reaction)) {
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        // Check if a reaction by this user for this post already exists
        const existingReaction = await db.post_reactions.findOne({
            where: { postId, userId },
        });

        if (existingReaction) {
            // Update the reaction type
            existingReaction.reaction = reaction;
            await existingReaction.save();
            return res.status(200).json({ message: 'Reaction updated' });
        } else {
            // Create a new reaction
            await db.post_reactions.create({ postId, userId, reaction });
            return res.status(201).json({ message: 'Reaction added' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not update reaction' });
    }
});

export { router };
