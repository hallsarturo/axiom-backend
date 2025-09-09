import { Router } from 'express';
import db from '../../models/index.js';
import authenticate from '../../lib/authenticate.js';

const router = Router();

// Get chat history with another user
router.get('/history/:userId', authenticate, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const otherUserId = parseInt(req.params.userId);

        const messages = await db.chat_messages.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    {
                        senderId: currentUserId,
                        recipientId: otherUserId,
                    },
                    {
                        senderId: otherUserId,
                        recipientId: currentUserId,
                    },
                ],
            },
            order: [['createdAt', 'ASC']],
            limit: 100,
        });

        // Mark messages from the other user as read
        await db.chat_messages.update(
            { isRead: true },
            {
                where: {
                    senderId: otherUserId,
                    recipientId: currentUserId,
                    isRead: false,
                },
            }
        );

        res.status(200).json({ messages });
    } catch (err) {
        console.error('Error fetching chat history:', err);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Get chat conversations (list of users with latest message)
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const currentUserId = req.userId;

        // Get latest message with each user
        const conversations = await db.sequelize.query(
            `
            SELECT DISTINCT ON (other_user_id) 
                other_user_id,
                message_id,
                content,
                is_read,
                created_at,
                username,
                user_profile_pic
            FROM (
                SELECT 
                    CASE WHEN sender_id = :currentUserId THEN recipient_id ELSE sender_id END as other_user_id,
                    id as message_id,
                    content,
                    is_read,
                    created_at
                FROM chat_messages
                WHERE sender_id = :currentUserId OR recipient_id = :currentUserId
            ) AS messages
            JOIN users ON users.id = other_user_id
            ORDER BY other_user_id, created_at DESC
        `,
            {
                replacements: { currentUserId },
                type: db.sequelize.QueryTypes.SELECT,
            }
        );

        res.status(200).json({ conversations });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

export { router };
