import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/posts/papers:
 *   get:
 *     summary: Get paginated paper posts
 *     description: Retrieve paginated posts of type 'paper' with reaction and engagement statistics. Supports infinite scrolling via pagination. 
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (for pagination)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: Number of posts per page (max 200)
 *     responses:
 *       200:
 *         description: List of paginated paper posts with stats
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - JWT required
 *       500:
 *         description: Could not fetch posts
 */

router.get('/papers', async (req, res) => {
    try {
        // Parse pagination params with defaults and limits
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 50, 200); // max 200 per page
        const offset = (page - 1) * pageSize;

        // Get total count and paginated results
        const { count, rows: paperPosts } = await db.posts.findAndCountAll({
            where: { type: 'paper' },
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset,
        });

        // Optionally, fetch stats for each post (can be optimized)
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

                // Exclude 'abstract' and 'content' from the response
                const { abstract, content, ...postData } = post.toJSON();

                return {
                    ...postData,
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

        res.status(200).json({
            paperPosts: postsWithStats,
            pagination: {
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch posts' });
    }
});

/**
 * @swagger
 * /api/posts/reaction:
 *   put:
 *     summary: Add or update a reaction for a post
 *     description: Adds a new reaction or updates an existing reaction for the authenticated user on the specified post. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *               reaction:
 *                 type: string
 *                 enum: [like, dislike, laugh, anger]
 *                 description: The type of reaction to add or update
 *     responses:
 *       200:
 *         description: Reaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       201:
 *         description: Reaction added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid reaction type
 *       401:
 *         description: Unauthorized - JWT required
 *       500:
 *         description: Could not update reaction
 */

router.put('/reaction', async (req, res) => {
    try {
        let userId;
        const { postId, reaction } = req.body;

        if (process.env.NODE_ENV === 'development') {
            userId = req.body?.userId || req.user?.id;
        } else {
            userId = req.user?.id;
        }

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!postId) {
            return res.status(400).json({ error: 'No postId provided' });
        }

        if (!['like', 'dislike', 'laugh', 'anger'].includes(reaction)) {
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        const existingReaction = await db.post_reactions.findOne({
            where: { postId, userId },
        });

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                await existingReaction.destroy();
                return res.status(200).json({ message: 'Reaction removed' });
            } else {
                existingReaction.reaction = reaction;
                await existingReaction.save();
                return res.status(200).json({ message: 'Reaction updated' });
            }
        } else {
            await db.post_reactions.create({ postId, userId, reaction });
            return res.status(201).json({ message: 'Reaction added' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not update reaction' });
    }
});

router.get('/:postId', async (req, res) => {
    const { postId } = req.params;
    let userId;

    if (process.env.NODE_ENV === 'development') {
        userId = req.query?.userId || req.user?.id; // Use query param for dev
        console.log('Req userId: ', userId);
    } else {
        userId = req.user?.id;
        console.log('Req  else userId: ', userId);
    }

    try {
        const post = await db.posts.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const likes = await db.post_reactions.count({
            where: { postId, reaction: 'like' },
        });
        const dislikes = await db.post_reactions.count({
            where: { postId, reaction: 'dislike' },
        });
        const laughs = await db.post_reactions.count({
            where: { postId, reaction: 'laugh' },
        });
        const angers = await db.post_reactions.count({
            where: { postId, reaction: 'anger' },
        });

        let currentUserReaction = null;
        if (userId) {
            console.log('db entered user id: ', userId);
            const reactionObj = await db.post_reactions.findOne({
                where: { postId, userId },
            });
            currentUserReaction = reactionObj ? reactionObj.reaction : null;
        }

        const { abstract, content, ...postData } = post.toJSON();
        console.log('currentUserReaction: ', currentUserReaction);

        const response = {
            ...postData,
            likes,
            dislikes,
            laughs,
            angers,
            currentUserReaction,
        };

        res.json(response);
    } catch (err) {
        console.error('/:postId error: ', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export { router };
