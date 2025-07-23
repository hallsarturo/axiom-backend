import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/posts/papers:
 *   get:
 *     summary: Get all paper posts
 *     description: Returns all posts of type 'paper' from the posts table.
 *     responses:
 *       200:
 *         description: List of paper posts
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
 *       500:
 *         description: Could not fetch posts
 */

router.use('/papers', async (req, res) => {
    try {
        // get all elements from posts type: paper
        const paperPosts = await db.posts.findAll({
            where: { type: 'paper' },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ paperPosts });
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch posts' });
    }
});

export { router };
