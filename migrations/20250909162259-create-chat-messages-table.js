import { QueryInterface, DataTypes } from 'sequelize';
import logger from '../../lib/winston.js';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });

    // Check if indices exist before creating them
    try {
        // Add index for recipient's unread messages
        await queryInterface.addIndex(
            'chat_messages',
            ['recipientId', 'isRead'],
            {
                name: 'chat_messages_recipient_id_is_read',
            }
        );

        // Add a composite index for conversation queries
        await queryInterface.addIndex(
            'chat_messages',
            [
                Sequelize.literal('LEAST("senderId", "recipientId")'),
                Sequelize.literal('GREATEST("senderId", "recipientId")'),
                'createdAt',
            ],
            {
                name: 'chat_messages_conversation_created_at',
            }
        );
    } catch (error) {
        logger.log('Some indices may already exist:', error.message);
    }
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_messages');
}
