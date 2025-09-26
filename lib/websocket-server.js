import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import logger from './winston.js';

// Connection tracking
const connections = new Map(); // userId -> ws
const wsToUserId = new Map(); // ws -> userId

export default function initWebsocket(server) {
    const wss = new WebSocketServer({
        server, // Attach to existing HTTPS server
        path: '/ws', // Match your frontend URL path
    });

    logger.log('WebSocket server initialized');

    wss.on('connection', async (ws, req) => {
        try {
            // Parse the URL to get query parameters
            const url = new URL(req.url, 'https://localhost');
            const userId = url.searchParams.get('userId');
            const token = url.searchParams.get('token');

            // Authenticate the connection
            if (!userId || !token) {
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify JWT token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.id !== parseInt(userId)) {
                    ws.close(1008, 'Invalid authentication');
                    return;
                }
            } catch (err) {
                logger.error('WebSocket authentication error:', err);
                ws.close(1008, 'Authentication failed');
                return;
            }

            // Store the connection with user ID mapping
            connections.set(userId, ws);
            wsToUserId.set(ws, userId);

            logger.log(`WebSocket client connected: User ${userId}`);

            // Send welcome message
            ws.send(
                JSON.stringify({
                    type: 'connection',
                    data: { status: 'connected', userId },
                })
            );

            // Handle incoming messages
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);

                    // Handle different message types
                    switch (message.type) {
                        case 'chat':
                            await handleChatMessage(userId, message);
                            break;
                        case 'notification':
                            await handleNotification(userId, message);
                            break;
                        case 'ping':
                            ws.send(
                                JSON.stringify({
                                    type: 'pong',
                                    timestamp: Date.now(),
                                })
                            );
                            break;
                        default:
                            logger.warn(
                                `Unknown message type: ${message.type}`
                            );
                    }
                } catch (err) {
                    logger.error('Error processing message:', err);
                }
            });

            // Handle disconnection
            ws.on('close', () => {
                const userId = wsToUserId.get(ws);
                connections.delete(userId);
                wsToUserId.delete(ws);
                logger.log(`WebSocket client disconnected: User ${userId}`);
            });
        } catch (error) {
            logger.error('WebSocket connection error:', error);
            ws.close(1011, 'Server error');
        }
    });

    // Handle chat messages
    async function handleChatMessage(senderId, message) {
        try {
            const { recipientId, content } = message.data;

            if (!recipientId || !content) {
                return;
            }

            // Store message in database
            const chatMessage = await db.chat_messages.create({
                senderId: parseInt(senderId),
                recipientId: parseInt(recipientId),
                content,
                createdAt: new Date(),
            });

            // Prepare the message to send
            const outgoingMessage = {
                type: 'chat',
                data: {
                    id: chatMessage.id,
                    senderId: parseInt(senderId),
                    content,
                    createdAt: chatMessage.createdAt,
                },
            };

            // Send to recipient if online
            if (connections.has(recipientId)) {
                connections
                    .get(recipientId)
                    .send(JSON.stringify(outgoingMessage));
            }

            // Send back to sender as confirmation
            if (connections.has(senderId)) {
                connections.get(senderId).send(
                    JSON.stringify({
                        ...outgoingMessage,
                        data: {
                            ...outgoingMessage.data,
                            status: 'sent',
                        },
                    })
                );
            }
        } catch (err) {
            logger.error('Error handling chat message:', err);
        }
    }

    // Handle notifications
    async function handleNotification(senderId, message) {
        try {
            const { recipientId, notificationType, entityId, content } =
                message.data;

            if (!recipientId || !notificationType) {
                return;
            }

            // Store notification in database
            const notification = await db.notifications.create({
                userId: parseInt(recipientId),
                senderId: parseInt(senderId),
                type: notificationType,
                entityId: entityId || null,
                content: content || null,
                isRead: false,
                createdAt: new Date(),
            });

            // Send to recipient if online
            if (connections.has(recipientId)) {
                connections.get(recipientId).send(
                    JSON.stringify({
                        type: 'notification',
                        data: {
                            id: notification.id,
                            senderId: parseInt(senderId),
                            type: notificationType,
                            entityId,
                            content,
                            createdAt: notification.createdAt,
                        },
                    })
                );
            }
        } catch (err) {
            logger.error('Error handling notification:', err);
        }
    }

    // Utility function to send notification to a user
    return {
        sendNotification: async (userId, notification) => {
            if (connections.has(userId.toString())) {
                connections.get(userId.toString()).send(
                    JSON.stringify({
                        type: 'notification',
                        data: notification,
                    })
                );
            }
        },

        broadcastNotification: async (userIds, notification) => {
            userIds.forEach((userId) => {
                if (connections.has(userId.toString())) {
                    connections.get(userId.toString()).send(
                        JSON.stringify({
                            type: 'notification',
                            data: notification,
                        })
                    );
                }
            });
        },
    };
}
