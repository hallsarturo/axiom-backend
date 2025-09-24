import { Router } from 'express';
import db from '../../models/index.js';
import jwt from 'jsonwebtoken';
import authenticate from '../../lib/authenticate.js';
import { wsService } from '../../index.js';
import logger from '../../lib/winston.js';

const router = Router();

/**
 * @swagger
 * /api/comments/detail/{commentId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get a comment by its ID
 *     description: Returns a single comment by its ID, including user info and reaction counts.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the comment to retrieve
 *     responses:
 *       200:
 *         description: Comment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 postId:
 *                   type: integer
 *                 userId:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 userProfilePic:
 *                   type: string
 *                   nullable: true
 *                 content:
 *                   type: string
 *                 parentCommentId:
 *                   type: integer
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 likesCount:
 *                   type: integer
 *                 dislikesCount:
 *                   type: integer
 *                 laughsCount:
 *                   type: integer
 *                 angersCount:
 *                   type: integer
 *                 totalReactions:
 *                   type: integer
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Could not fetch comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/detail/:commentId', async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);
        const comment = await db.post_comments.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

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

        const likesCount = await db.comment_reactions.count({
            where: { commentId: comment.id, reaction: 'like' },
        });
        const dislikesCount = await db.comment_reactions.count({
            where: { commentId: comment.id, reaction: 'dislike' },
        });
        const laughsCount = await db.comment_reactions.count({
            where: { commentId: comment.id, reaction: 'laugh' },
        });
        const angersCount = await db.comment_reactions.count({
            where: { commentId: comment.id, reaction: 'anger' },
        });
        const totalReactions =
            likesCount + dislikesCount + laughsCount + angersCount;

        res.status(200).json({
            ...comment.toJSON(),
            username: user?.username || null,
            userProfilePic: profilePic,
            likesCount,
            dislikesCount,
            laughsCount,
            angersCount,
            totalReactions,
        });
    } catch (err) {
        logger.error('/detail/:commentId error: ', err);
        res.status(500).json({ error: 'Could not fetch comment' });
    }
});

/**
 * @swagger
 * /api/comments/{postId}/parents:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get parent comments for a post (paginated)
 *     description: Returns a paginated array of parent comments for the specified post. Each comment includes user info, children count, reaction counts, a flag indicating if it has children, and the current user's reaction.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to fetch parent comments for
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
 *         description: List of parent comments for the post
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
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       childrenCount:
 *                         type: integer
 *                       hasChildren:
 *                         type: boolean
 *                       likesCount:
 *                         type: integer
 *                       dislikesCount:
 *                         type: integer
 *                       laughsCount:
 *                         type: integer
 *                       angersCount:
 *                         type: integer
 *                       totalReactions:
 *                         type: integer
 *                       currentUserReaction:
 *                         type: string
 *                         nullable: true
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of comments (parents + children) for the post
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

router.get('/:postId/parents', async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50);
        const offset = (page - 1) * pageSize;
        const userId = req.query.userId || null;

        // Count all comments for the post (parents + children)
        const totalCount = await db.post_comments.count({
            where: { postId },
        });

        // Fetch only parent comments for pagination
        const { rows: parents } = await db.post_comments.findAndCountAll({
            where: { postId, parentCommentId: null },
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset,
            attributes: ['id', 'postId', 'userId', 'content', 'createdAt'],
        });

        // Enrich comments with username and profile pic
        const enrichedComments = await Promise.all(
            parents.map(async (comment) => {
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

                const childrenCount = await db.post_comments.count({
                    where: { parentCommentId: comment.id },
                });

                // Get reaction counts from comment_reactions table
                const likesCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'like' },
                });
                const dislikesCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'dislike' },
                });
                const laughsCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'laugh' },
                });
                const angersCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'anger' },
                });
                const totalReactions =
                    likesCount + dislikesCount + laughsCount + angersCount;

                let currentUserReaction = null;
                if (userId) {
                    const reactionObj = await db.comment_reactions.findOne({
                        where: {
                            commentId: comment.id,
                            userId: userId,
                        },
                    });
                    currentUserReaction = reactionObj
                        ? reactionObj.reaction
                        : null;
                }

                return {
                    ...comment.toJSON(),
                    childrenCount,
                    hasChildren: childrenCount > 0,
                    username: user?.username || null,
                    userProfilePic: profilePic,
                    likesCount,
                    dislikesCount,
                    laughsCount,
                    angersCount,
                    totalReactions,
                    currentUserReaction,
                };
            })
        );

        res.status(200).json({
            comments: enrichedComments,
            totalCount,
            pagination: {
                page,
                pageSize,
                totalPages: Math.ceil(totalCount / pageSize),
            },
        });
    } catch (err) {
        logger.error('/:postId error: ', err);
        res.status(500).json({ error: 'Could not fetch comments' });
    }
});

/**
 * @swagger
 * /api/comments/{postId}/children/{parentCommentId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get child comments for a parent comment (paginated)
 *     description: Returns a paginated array of child comments for the specified parent comment. Each comment includes user info, reaction counts, and the current user's reaction.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post
 *       - in: path
 *         name: parentCommentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the parent comment
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: The ID of the current user (for currentUserReaction)
 *     responses:
 *       200:
 *         description: List of child comments for the parent comment
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
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       likesCount:
 *                         type: integer
 *                       dislikesCount:
 *                         type: integer
 *                       laughsCount:
 *                         type: integer
 *                       angersCount:
 *                         type: integer
 *                       totalReactions:
 *                         type: integer
 *                       currentUserReaction:
 *                         type: string
 *                         nullable: true
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of child comments for the parent
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
 *         description: Could not fetch child comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/:postId/children/:parentCommentId', async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const parentCommentId = Number(req.params.parentCommentId);
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50);
        const offset = (page - 1) * pageSize;
        const userId = req.query.userId || null;

        // Fetch child comments for the parent
        const { count, rows: children } =
            await db.post_comments.findAndCountAll({
                where: { postId, parentCommentId },
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
            });

        // Enrich child comments with username and profile pic
        const enrichedChildren = await Promise.all(
            children.map(async (comment) => {
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

                // Get reaction counts from comment_reactions table
                const likesCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'like' },
                });
                const dislikesCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'dislike' },
                });
                const laughsCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'laugh' },
                });
                const angersCount = await db.comment_reactions.count({
                    where: { commentId: comment.id, reaction: 'anger' },
                });
                const totalReactions =
                    likesCount + dislikesCount + laughsCount + angersCount;

                let currentUserReaction = null;
                if (userId) {
                    const reactionObj = await db.comment_reactions.findOne({
                        where: {
                            commentId: comment.id,
                            userId: userId,
                        },
                    });
                    currentUserReaction = reactionObj
                        ? reactionObj.reaction
                        : null;
                }

                return {
                    ...comment.toJSON(),
                    username: user?.username || null,
                    userProfilePic: profilePic,
                    likesCount,
                    dislikesCount,
                    laughsCount,
                    angersCount,
                    totalReactions,
                    currentUserReaction,
                };
            })
        );

        res.status(200).json({
            comments: enrichedChildren,
            totalCount: count,
            pagination: {
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            },
        });
    } catch (err) {
        logger.error('/:postId/children/:parentCommentId error: ', err);
        res.status(500).json({ error: 'Could not fetch child comments' });
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

        const post = await db.posts.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

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

        // Get commenter's username for the notification
        const commenter = await db.users.findByPk(userId, {
            attributes: ['username'],
        });

        // Only notify if commenter is not the post author
        if (post.userId !== userId) {
            // Create notification in database
            const notification = await db.notifications.create({
                userId: post.userId,
                senderId: userId,
                type: 'comment',
                entityId: postId,
                content: content.substring(0, 100), // Preview of comment content
                isRead: false,
                createdAt: new Date(),
            });

            // Send real-time notification via WebSocket
            wsService?.sendNotification(post.userId.toString(), {
                id: notification.id,
                type: 'comment',
                senderId: userId,
                senderName: commenter.username,
                entityId: postId,
                content: content.substring(0, 100),
                createdAt: notification.createdAt,
            });
        }

        return res
            .status(201)
            .json({ message: 'Comment added', comment: newComment });
    } catch (err) {
        logger.error('/:postId/:parentCommentId error: ', err);
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

        // Find all child comments recursively
        async function getAllChildCommentIds(parentId) {
            const children = await db.post_comments.findAll({
                where: { parentCommentId: parentId },
                attributes: ['id'],
            });
            let ids = children.map((c) => c.id);
            for (const childId of ids) {
                const grandChildren = await getAllChildCommentIds(childId);
                ids = ids.concat(grandChildren);
            }
            return ids;
        }

        const childCommentIds = await getAllChildCommentIds(commentId);

        // Delete all child comments (cascade)
        if (childCommentIds.length > 0) {
            await db.post_comments.destroy({
                where: { id: childCommentIds },
            });
        }

        // Delete the parent comment
        await existingComment.destroy();

        // Decrement the commentsCount in the related post
        await db.posts.increment(
            { commentsCount: -(1 + childCommentIds.length) },
            { where: { id: postId } }
        );

        return res
            .status(200)
            .json({ message: 'Comment and its children removed' });
    } catch (err) {
        logger.error('/comments/:commentId error: ', err);
        res.status(500).json({ error: 'Could not process comment' });
    }
});

/**
 * @swagger
 * /api/comments/reaction:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Add/update/remove a reaction for a comment
 *     description: Adds a new reaction, updates an existing reaction, or removes it if the same reaction is sent again. Updates counters on the comment record.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: integer
 *               reaction:
 *                 type: string
 *                 enum: [like, dislike, laugh, anger]
 *     responses:
 *       200:
 *         description: Reaction removed or updated
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
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Could not process reaction
 */

router.put('/reaction', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId, reaction } = req.body;

        if (!commentId) {
            return res.status(400).json({ error: 'No commentId provided' });
        }

        if (!['like', 'dislike', 'laugh', 'anger'].includes(reaction)) {
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        // Get comment to find author
        const comment = await db.post_comments.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Don't notify if the author is reacting to their own comment
        const isOwnComment = comment.userId === userId;

        // Get reactor's username
        const reactor = await db.users.findByPk(userId, {
            attributes: ['username'],
        });

        const existingReaction = await db.comment_reactions.findOne({
            where: { commentId, userId },
        });

        let result;
        let notificationType;

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                await existingReaction.destroy();
                result = { status: 200, message: 'Reaction removed' };
                // No notification for removing reactions
            } else {
                existingReaction.reaction = reaction;
                await existingReaction.save();
                result = { status: 200, message: 'Reaction updated' };
                notificationType = `comment_reaction_${reaction}`;
            }
        } else {
            await db.comment_reactions.create({ commentId, userId, reaction });
            result = { status: 201, message: 'Reaction added' };
            notificationType = `comment_reaction_${reaction}`;
        }

        // Send notification if not reacting to own comment and we're adding/updating a reaction
        if (!isOwnComment && notificationType) {
            try {
                // Create notification record
                const notification = await db.notifications.create({
                    userId: comment.userId, // Comment author receives the notification
                    senderId: userId, // Reactor is the sender
                    type: notificationType, // Type of notification
                    entityId: commentId, // ID of the comment
                    content: `${reactor.username} reacted with ${reaction} to your comment`,
                    isRead: false,
                    createdAt: new Date(),
                });

                // Send real-time notification via WebSocket
                wsService?.sendNotification(comment.userId.toString(), {
                    id: notification.id,
                    type: notificationType,
                    senderId: userId,
                    senderName: reactor.username,
                    entityId: commentId,
                    content: `${reactor.username} reacted with ${reaction} to your comment`,
                    createdAt: notification.createdAt,
                });
            } catch (notifError) {
                logger.error('Failed to send notification:', notifError);
                // Don't fail the API call if notification sending fails
            }
        }

        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        logger.error('/comment/reaction error: ', err);
        res.status(500).json({ error: 'Could not process comment reaction' });
    }
});

export { router };
