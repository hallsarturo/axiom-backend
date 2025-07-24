import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/posts/papers:
 *   get:
 *     summary: Get all paper posts
 *     description: Returns all posts of type 'paper' from the posts table, including counts for likes, dislikes, laughs, angers, total reactions, comments, and shares.
 *     responses:
 *       200:
 *         description: List of paper posts with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
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
 *       500:
 *         description: Could not
 * @swagger
 * /api/posts/papers:
 *   get:
 *     summary: Get all paper posts
 *     description: Returns all posts of type 'paper' from the posts table, including likes, dislikes, comments, and shares counts.
 *     responses:
 *       200:
 *         description: List of paper posts with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
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
 *                       likes:
 *                         type: integer
 *                       dislikes:
 *                         type: integer
 *                       comments:
 *                         type: integer
 *                       shares:
 *                         type: integer
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
                    where: { postId: post.id, type: 'like' },
                });
                const dislikes = await db.post_reactions.count({
                    where: { postId: post.id, type: 'dislike' },
                });
                const laughs = await db.post_reactions.count({
                    where: { postId: post.id, type: 'laugh' },
                });
                const angers = await db.post_reactions.count({
                    where: { postId: post.id, type: 'anger' },
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

        res.status(200).json({ posts: postsWithStats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch posts' });
    }
});

export { router };
