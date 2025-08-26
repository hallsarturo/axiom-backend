import { Router } from 'express';
import db from '../../models/index.js';

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search users, paper authors, and posts
 *     description: Returns matching users, paper authors, and posts for a given query string.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: The search query string
 *     responses:
 *       200:
 *         description: Search results for users, paper authors, and posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                             example: user
 *                           username:
 *                             type: string
 *                           key:
 *                             type: string
 *                       - type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                             example: author
 *                           author:
 *                             type: string
 *                           key:
 *                             type: string
 *                       - type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                             example: post
 *                           title:
 *                             type: string
 *                           key:
 *                             type: string
 *       400:
 *         description: Missing or invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
    // search paperAuthors by author name (case-insensitive)
    const paperAuthors = await db.posts.findAll({
        where: {
            type: 'paper',
            author: { [db.Sequelize.Op.iLike]: `%${q}%` },
        },
        attributes: ['id', 'author'],
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
        key: `user-${u.id}`, // unique key for React
    }));
    const postResults = posts.map((p) => ({
        id: p.id,
        type: 'post',
        title: p.title,
        key: `post-${p.id}`, // unique key for React
    }));
    const authorResults = paperAuthors.map((p) => ({
        id: p.id,
        type: 'author',
        author: p.author,
        key: `author-${p.id}`,
    }));

    res.json({ results: [...userResults, ...authorResults, ...postResults] });
});

export { router };
