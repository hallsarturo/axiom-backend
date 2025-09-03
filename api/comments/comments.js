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
 *     description: Returns a paginated array of all comments for the specified post, including nested comments. Each comment includes all fields from the post_comments record, plus the username and userProfilePic (or photoUrl from auth_providers if userProfilePic is null).
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
 *                       username:
 *                         type: string
 *                       userProfilePic:
 *                         type: string
 *                         nullable: true
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
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
            });

        // Enrich comments with username and profile pic
        const enrichedComments = await Promise.all(
            comments.map(async (comment) => {
                const user = await db.users.findByPk(comment.userId, {
                    attributes: ['username', 'userProfilePic'],
                });

                let profilePic = user?.userProfilePic || null;
                if (!profilePic) {
                    const provider = await db.auth_providers.findOne({
                        where: { userId: comment.userId },
                        attributes: ['photoUrl'],
                    });
                    profilePic = provider?.photoUrl || null;
                }

                return {
                    ...comment.toJSON(),
                    username: user?.username || null,
                    userProfilePic: profilePic,
                };
            })
        );

        res.status(200).json({
            comments: enrichedComments,
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

/**
 * @swagger
 * /api/comments/{postId}:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Add a comment to a post
 *     description: Creates a new comment for the specified post. Supports nested comments via parentCommentId. Increments the commentsCount in the related post.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The comment text
 *               parentCommentId:
 *                 type: integer
 *                 nullable: true
 *                 description: The ID of the parent comment (for nested comments)
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment added
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     postId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     content:
 *                       type: string
 *                     parentCommentId:
 *                       type: integer
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Could not process comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.post('/:postId', authenticate, async (req, res) => {
    try {
        let userId = req.userId;
        const postId = Number(req.params.postId);
        const { content, parentCommentId } = req.body;

        const newComment = await db.post_comments.create({
            postId,
            userId,
            content,
            parentCommentId: parentCommentId || null,
        });

        await db.posts.increment(
            { commentsCount: +1 },
            { where: { id: postId } }
        );
        return res
            .status(201)
            .json({ message: 'Comment added', comment: newComment });
    } catch (err) {
        console.error('/:postId/:parentCommentId error: ', err);
        res.status(500).json({ error: 'Could not process comment' });
    }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment by its ID
 *     description: Deletes a comment by its ID if the authenticated user is the owner. Also decrements the commentsCount in the related post.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment removed
 *       404:
 *         description: Comment does not exist or user does not have permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment does not exist or you do not have permission to delete it.
 *       500:
 *         description: Could not process comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.delete('/:commentId', authenticate, async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);
        const userId = req.userId;

        // Find the comment by its ID
        const existingComment = await db.post_comments.findOne({
            where: { id: commentId, userId },
        });

        if (!existingComment) {
            return res.status(404).json({
                message:
                    'Comment does not exist or you do not have permission to delete it.',
            });
        }

        const postId = existingComment.postId;

        // Delete the comment
        await existingComment.destroy();

        // Decrement the commentsCount in the related post
        await db.posts.increment(
            { commentsCount: -1 },
            { where: { id: postId } }
        );

        return res.status(200).json({ message: 'Comment removed' });
    } catch (err) {
        console.error('/comments/:commentId error: ', err);
        res.status(500).json({ error: 'Could not process comment' });
    }
});

export { router };
