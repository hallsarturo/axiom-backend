import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Global search for users and posts
 *     description: Search users by username and posts by title. Returns a combined list of results.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results for users and posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                         enum: [user, post]
 *                       username:
 *                         type: string
 *                         nullable: true
 *                       title:
 *                         type: string
 *                         nullable: true
 */

router.get('/', async (req, res) => {
    const q = req.query.q?.trim();
    if (!q) return res.json({ results: [] });

    // Search user by username (case-insensitive)
    const users = await db.users.findAll({
        where: {
            username: { [db.Sequelize.Op.iLike]: `%${q}%` },
        },
        attributes: ['id', 'username'],
        limit: 5,
    });

    // Search posts by title (case-insensitive)
    const posts = await db.posts.findAll({
        where: {
            title: { [db.Sequelize.Op.iLike]: `%${q}%` },
        },
        attributes: ['id', 'title'],
        limit: 10,
    });

    // Tag results for frontend
    const userResults = users.map((u) => ({
        id: u.id,
        type: 'user',
        username: u.username,
    }));
    const postResults = posts.map((p) => ({
        id: p.id,
        type: 'post',
        title: p.title,
    }));

    res.json({ results: [...userResults, ...postResults] });
});

export { router };
