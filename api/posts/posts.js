import { Router } from 'express';
import db from '../../models/index.js';
import jwt from 'jsonwebtoken';
import { uploadPostImage } from '../../lib/upload.js';
import authenticate from '../../lib/authenticate.js';
import { getUserProfilePic } from '../../lib/user-utils.js';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * @swagger
 * /api/posts/papers:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get paginated paper posts
 *     description: Retrieve paginated posts of type 'paper' with reaction and engagement statistics. Supports infinite scrolling via pagination. Optionally returns isBookmarked if userId is provided.
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user ID to check if each post is bookmarked
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
 *                       isBookmarked:
 *                         type: boolean
 *                         description: True if the post is bookmarked by the userId provided
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
        let userId;
        let token;

        // Try to extract token, but ignore if not present
        if (process.env.NODE_ENV === 'production') {
            token = req.cookies?.token;
        } else {
            const authHeader = req.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.replace('Bearer ', '');
            } else {
                token = req.cookies?.token;
            }
        }

        // If token exists, extract userId, else leave undefined
        if (token) {
            try {
                const payload = jwt.verify(token, 'secret');
                userId = payload.id;
            } catch (err) {
                userId = undefined; // Invalid token, treat as not logged in
            }
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50);
        const offset = (page - 1) * pageSize;

        // Get posts with stats directly from posts table
        const { count, rows: paperPosts } = await db.posts.findAndCountAll({
            attributes: [
                'id',
                'title',
                'description',
                'identifier',
                'author',
                'createdAt',
                'type',
                'image',
                'userId',
                'likesCount',
                'dislikesCount',
                'laughsCount',
                'angersCount',
                'commentsCount',
                'sharesCount',
            ],
            where: { type: 'paper' },
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset,
        });

        const postIds = paperPosts.map((post) => post.id);

        // Get bookmarks only if userId is present
        let bookmarkedPostIds = [];
        if (userId) {
            const bookmarks = await db.post_bookmarks.findAll({
                where: { userId, postId: postIds },
                attributes: ['postId'],
            });
            bookmarkedPostIds = bookmarks.map((b) => b.postId);
        }

        const postsWithStats = paperPosts.map((post) => {
            const postId = post.id;
            const { abstract, content, ...postData } = post.toJSON();
            const cleanIdentifier = post.identifier?.startsWith('oai:')
                ? post.identifier.replace(/^oai:/, '')
                : post.identifier;

            // Use counts directly from the post record
            const likes = post.likesCount || 0;
            const dislikes = post.dislikesCount || 0;
            const laughs = post.laughsCount || 0;
            const angers = post.angersCount || 0;
            const comments = post.commentsCount || 0;
            const shares = post.sharesCount || 0;
            const totalReactions = likes + dislikes + laughs + angers;

            // Only return isBookmarked if userId is present
            const isBookmarked = userId
                ? bookmarkedPostIds.includes(postId)
                : false;

            return {
                ...postData,
                identifier: cleanIdentifier,
                totalReactions,
                likes,
                dislikes,
                laughs,
                angers,
                comments,
                shares,
                isBookmarked,
            };
        });

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
 * /api/posts/userposts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get paginated user posts
 *     description: Retrieve paginated posts of type 'user' with reaction and engagement statistics. If the user is authenticated, each post will include isBookmarked.
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
 *           default: 20
 *           maximum: 50
 *         description: Number of posts per page (max 50)
 *     responses:
 *       200:
 *         description: List of paginated user posts with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: integer
 *                         description: The ID of the post
 *                       id:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       author:
 *                         type: string
 *                       imgSrc:
 *                         type: string
 *                       authorProfilePic:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
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
 *                       isBookmarked:
 *                         type: boolean
 *                         description: True if the post is bookmarked by the authenticated user
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
 *       500:
 *         description: Could not fetch posts
 */

router.get('/userposts', async (req, res) => {
    try {
        let userId;
        let token;

        // Try to extract token, but ignore if not present
        if (process.env.NODE_ENV === 'production') {
            token = req.cookies?.token;
        } else {
            const authHeader = req.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.replace('Bearer ', '');
            } else {
                token = req.cookies?.token;
            }
        }

        // If token exists, extract userId, else leave undefined
        if (token) {
            try {
                const payload = jwt.verify(token, 'secret');
                userId = payload.id;
            } catch (err) {
                userId = undefined; // Invalid token, treat as not logged in
            }
        }

        // Parse pagination params with defaults and limits
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50); // Lower max for better performance
        const offset = (page - 1) * pageSize;

        // Get total count and paginated results (with only necessary fields)
        const { count, rows: userPosts } = await db.posts.findAndCountAll({
            attributes: [
                'id',
                'title',
                'description',
                'author',
                'createdAt',
                'type',
                'image',
                'userId',
                'likesCount',
                'dislikesCount',
                'laughsCount',
                'angersCount',
                'commentsCount',
                'sharesCount',
            ],
            where: { type: 'user' },
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset,
        });

        const postIds = userPosts.map((post) => post.id);

        // Get bookmarks only if userId is present
        let bookmarkedPostIds = [];
        if (userId) {
            const bookmarks = await db.post_bookmarks.findAll({
                where: { userId, postId: postIds },
                attributes: ['postId'],
            });
            bookmarkedPostIds = bookmarks.map((b) => b.postId);
        }

        // Map the counts to each post
        const postsWithStats = await Promise.all(
            userPosts.map(async (post) => {
                const postId = post.id;
                const { abstract, content, image, userId, ...postData } =
                    post.toJSON();

                // Get user (author's) profile pic from posts userId
                const profilePic = await getUserProfilePic(userId);

                // Use counts directly from the post record
                const likes = post.likesCount || 0;
                const dislikes = post.dislikesCount || 0;
                const laughs = post.laughsCount || 0;
                const angers = post.angersCount || 0;
                const comments = post.commentsCount || 0;
                const shares = post.sharesCount || 0;
                const totalReactions = likes + dislikes + laughs + angers;

                // Only return isBookmarked if userId is present
                const isBookmarked = userId
                    ? bookmarkedPostIds.includes(postId)
                    : false;

                return {
                    postId,
                    ...postData,
                    userId,
                    imgSrc: image ? image : null,
                    authorProfilePic: profilePic,
                    totalReactions,
                    isBookmarked,
                    likes,
                    dislikes,
                    laughs,
                    angers,
                    comments,
                    shares,
                    isBookmarked,
                };
            })
        );
        console.log('userPosts response:', postsWithStats); // Debug output

        res.status(200).json({
            userPosts: postsWithStats,
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
 *     tags:
 *       - Posts
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
 *                 type: integer
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
        // console.log('\n\n/reaction request: ', req.body, '\n\n');

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
                // Decrement the counter for this reaction type
                await db.posts.increment(
                    { [`${reaction}sCount`]: -1 },
                    { where: { id: postId } }
                );
                return res.status(200).json({ message: 'Reaction removed' });
            } else {
                // Decrement old reaction, increment new reaction
                await db.posts.increment(
                    { [`${existingReaction.reaction}sCount`]: -1 },
                    { where: { id: postId } }
                );
                existingReaction.reaction = reaction;
                await existingReaction.save();
                await db.posts.increment(
                    { [`${reaction}sCount`]: 1 },
                    { where: { id: postId } }
                );
                return res.status(200).json({ message: 'Reaction updated' });
            }
        } else {
            await db.post_reactions.create({ postId, userId, reaction });
            // Increment the counter for this reaction type
            await db.posts.increment(
                { [`${reaction}sCount`]: 1 },
                { where: { id: postId } }
            );
            return res.status(201).json({ message: 'Reaction added' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not update reaction' });
    }
});

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get a single post by ID with reaction stats
 *     description: Returns a single post with its reaction counts and the current user's reaction.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to retrieve
 *     responses:
 *       200:
 *         description: Post details with reaction stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 author:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 likes:
 *                   type: integer
 *                 dislikes:
 *                   type: integer
 *                 laughs:
 *                   type: integer
 *                 angers:
 *                   type: integer
 *                 currentUserReaction:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */

router.get('/:postId', async (req, res) => {
    const { postId } = req.params;
    let userId;

    if (process.env.NODE_ENV === 'development') {
        userId = req.query?.userId || req.user?.id; // Use query param for dev
        // console.log('Req userId: ', userId);
    } else {
        userId = req.user?.id;
        // console.log('Req  else userId: ', userId);
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

        // Calculate totalReactions for this post
        const totalReactions = likes + dislikes + laughs + angers;
        //console.log(`Post ${postId} totalReactions:`, totalReactions);

        let currentUserReaction = null;
        if (userId) {
            const reactionObj = await db.post_reactions.findOne({
                where: { postId, userId },
            });
            currentUserReaction = reactionObj ? reactionObj.reaction : null;
        }

        const { abstract, content, ...postData } = post.toJSON();

        const response = {
            ...postData,
            likes,
            dislikes,
            laughs,
            angers,
            totalReactions,
            currentUserReaction,
        };

        res.json(response);
    } catch (err) {
        console.error('/:postId error: ', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get paginated posts by user ID
 *     description: Returns paginated posts created by the specified user. No authentication required.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose posts to fetch
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
 *         description: Number of posts per page (max 50)
 *     responses:
 *       200:
 *         description: List of paginated posts by user
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
 *                       author:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                       image:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of posts by this user
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
 *       404:
 *         description: No posts found for user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/user/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 20, 50);
        const offset = (page - 1) * pageSize;

        const { count, rows: posts } = await db.posts.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            attributes: [
                'id',
                'title',
                'description',
                'author',
                'createdAt',
                'type',
                'image',
            ],
            limit: pageSize,
            offset,
        });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: 'No posts found for user' });
        }

        res.status(200).json({
            posts,
            totalCount: count,
            pagination: {
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            },
        });
    } catch (err) {
        console.error('/user/:userId posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/posts/user-publish:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Publish a new user post
 *     description: Creates a new post with the provided title, content, and author. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     author:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Could not create post
 */

router.post(
    '/user-publish',
    authenticate,
    uploadPostImage.single('image'),
    async (req, res) => {
        try {
            const { title, content } = req.body;
            const userId = req.userId;

            if (!userId || !title) {
                return res
                    .status(400)
                    .json({ error: 'Missing required fields' });
            }

            // Create post first (without image)
            const user = await db.users.findUserById({ id: userId });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newPost = await db.posts.create({
                userId,
                type: 'user',
                title,
                description: content,
                author: user.username,
                image: null, // will update after image upload
            });

            // If image uploaded, rename and update post
            if (req.file) {
                const ext = path.extname(req.file.originalname);
                const newFilename = `post_${userId}_${newPost.id}${ext}`;
                const oldPath = req.file.path;
                const newPath = path.join(req.file.destination, newFilename);

                // Rename file
                fs.renameSync(oldPath, newPath);

                // Update post with image path
                newPost.image = `uploads/post-images/${newFilename}`;
                await newPost.save();
            }

            // Reload the post to get the updated image field
            const postWithImage = await db.posts.findByPk(newPost.id);

            res.status(201).json({
                message: 'Post created',
                post: postWithImage,
            });
        } catch (err) {
            console.error('/publish/usertype error:', err);
            res.status(500).json({ error: 'Could not create post' });
        }
    }
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete a post by ID
 *     description: Deletes a post if the authenticated user is the owner of the post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized to delete this post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Post not found
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

router.delete('/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    let userId;

    if (process.env.NODE_ENV === 'development') {
        userId = req.query?.userId || req.userId;
    } else {
        userId = req.userId;
    }
    console.log('\n\nuser id: ', userId, 'post id: ', postId, '\n\n');
    try {
        const post = await db.posts.findByPk(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== userId) {
            return res
                .status(403)
                .json({ error: 'You are not authorized to delete this post' });
        }

        await post.destroy();
        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('/:postId delete error: ', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/posts/bookmark/{postId}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Bookmark or unmark a post
 *     description: Toggles a bookmark for the authenticated user on the specified post. If the post is already bookmarked, it will be removed; otherwise, it will be added.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the post to bookmark or unmark
 *     responses:
 *       200:
 *         description: Bookmark removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       201:
 *         description: Bookmark added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Post not found
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

router.put('/bookmark/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Check if post exists
        const post = await db.posts.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if bookmark exists for this user and post
        const bookmark = await db.post_bookmarks.findOne({
            where: { postId, userId },
        });

        if (bookmark) {
            // If exists, remove bookmark (unmark)
            await bookmark.destroy();
            return res.status(200).json({ message: 'Bookmark removed' });
        } else {
            // If not exists, create bookmark
            await db.post_bookmarks.create({ postId, userId });
            return res.status(201).json({ message: 'Bookmark added' });
        }
    } catch (err) {
        console.error('/bookmark/:postId put error: ', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/posts/bookmarks/{userId}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all bookmarked posts by user ID
 *     description: Returns all posts bookmarked by the specified user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose bookmarks to fetch
 *     responses:
 *       200:
 *         description: List of bookmarked posts
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
 *                       author:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                       image:
 *                         type: string
 *                 total:
 *                   type: integer
 *                   description: Total number of bookmarked posts
 *       500:
 *         description: Could not fetch bookmarks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/bookmarks/:userId', authenticate, async (req, res) => {
    try {
        let userId;

        if (process.env.NODE_ENV === 'development') {
            userId = req.query?.userId || req.userId;
        } else {
            userId = req.userId;
        }

        const bookmarks = await db.post_bookmarks.findAll({
            where: { userId },
            include: [
                {
                    model: db.posts,
                    attributes: [
                        'id',
                        'title',
                        'description',
                        'author',
                        'createdAt',
                        'type',
                        'image',
                    ],
                },
            ],
        });
        const posts = bookmarks.map((b) => b.post);

        res.status(200).json({ posts, total: posts.length });
    } catch (err) {
        console.error('/bookmarks/:userId error:', err);
        res.status(500).json({ error: 'Could not fetch bookmarks' });
    }
});

export { router };
