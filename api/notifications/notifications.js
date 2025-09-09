import { Router } from 'express';
import db from '../../models/index.js';
import authenticate from '../../lib/authenticate.js';

const router = Router();

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

        const unseenCount = await db.notifications.count({
            where: { userId, isRead: false },
        });

        res.status(200).json({
            notifications,
            unseenCount,
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

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
