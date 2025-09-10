import { Router } from 'express';
import db from '../../models/index.js';
import authenticate from '../../lib/authenticate.js';

const router = Router();

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notifications for a user
 *     description: Returns the latest notifications for the specified user. Only the authenticated user can access their own notifications. If the sender's userProfilePic is null, photoUrl from auth_providers is included.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose notifications are being fetched
 *     responses:
 *       200:
 *         description: List of notifications and unseen count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       senderId:
 *                         type: integer
 *                         nullable: true
 *                       type:
 *                         type: string
 *                       entityId:
 *                         type: integer
 *                         nullable: true
 *                       content:
 *                         type: string
 *                         nullable: true
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       sender:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           userProfilePic:
 *                             type: string
 *                             nullable: true
 *                           photoUrl:
 *                             type: string
 *                             nullable: true
 *                 unseenCount:
 *                   type: integer
 *                   description: Number of unseen notifications
 *       403:
 *         description: Forbidden (user cannot access another user's notifications)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Forbidden
 *       500:
 *         description: Failed to fetch notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Get user's notifications
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Ensure user can only see their own notifications
        if (req.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const notifications = await db.notifications.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
            include: [
                {
                    model: db.users,
                    as: 'sender',
                    attributes: ['id', 'username', 'userProfilePic'],
                },
            ],
        });

        // Enrich notifications with photoUrl from auth_providers if userProfilePic is null
        const enrichedNotifications = await Promise.all(
            notifications.map(async (notif) => {
                let sender = notif.sender?.toJSON?.() || notif.sender || {};
                if (!sender.userProfilePic) {
                    const provider = await db.auth_providers.findOne({
                        where: { userId: sender.id },
                        attributes: ['photoUrl'],
                    });
                    sender.userProfilePic = provider?.photoUrl || null;
                }
                return {
                    ...notif.toJSON(),
                    sender,
                };
            })
        );
        enrichedNotifications.forEach((notif) => {
            console.log(
                `backend pics: ${notif.sender?.userProfilePic} and ${notif.sender?.photoUrl}`
            );
        });

        const unseenCount = await db.notifications.count({
            where: { userId, isRead: false },
        });

        res.status(200).json({
            notifications: enrichedNotifications,
            unseenCount,
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * @swagger
 * /api/notifications/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark notifications as read
 *     description: Marks the specified notifications as read for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of notification IDs to mark as read
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notifications marked as read
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid request body
 *       500:
 *         description: Failed to update notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Mark notifications as read
router.put('/read', authenticate, async (req, res) => {
    try {
        const { notificationIds } = req.body;

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        await db.notifications.update(
            { isRead: true },
            {
                where: {
                    id: notificationIds,
                    userId: req.userId,
                },
            }
        );

        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

export { router };
