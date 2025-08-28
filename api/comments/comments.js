import { Router } from 'express';
import db from '../../models/index.js';
import jwt from 'jsonwebtoken';
import authenticate from '../../lib/authenticate.js';

const router = Router();

/**
 * @swagger
 * /api/comments/{postId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get all comments for a post (including nested)
 *     description: Returns a paginated array of all comments for the specified post, including nested comments. Each comment includes all fields from the post_comments record.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to fetch comments for
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
 *           default: 20
 *           maximum: 50
 *         description: Number of comments per page (max 50)
 *     responses:
 *       200:
 *         description: List of comments for the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       postId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       parentCommentId:
 *                         type: integer
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of comments for the post
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Could not fetch comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/:postId', async (req, res) => {
    try {
        // Pagination
        const postId = Number(req.params.postId);
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50);
        const offset = (page - 1) * pageSize;

        // Get all comments for the post (including nested)
        const { count, rows: comments } =
            await db.post_comments.findAndCountAll({
                attributes: [
                    'id',
                    'postId',
                    'userId',
                    'content',
                    'parentCommentId',
                    'createdAt',
                ],
                where: { postId },
                order: [['createdAt', 'ASC']],
                limit: pageSize,
                offset,
            });

        res.status(200).json({
            comments,
            totalCount: count,
            pagination: {
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            },
        });
    } catch (err) {
        console.error('/:postId error: ', err);
        res.status(500).json({ error: 'Could not fetch comments' });
    }
});

export { router };
