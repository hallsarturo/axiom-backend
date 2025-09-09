export default (sequelize, DataTypes) => {
    const ChatMessage = sequelize.define('chat_messages', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
            defaultValue: DataTypes.NOW,
        },
    }, { timestamps: false });

    ChatMessage.associate = (db) => {
        ChatMessage.belongsTo(db.users, { as: 'sender', foreignKey: 'senderId' });
        ChatMessage.belongsTo(db.users, { as: 'recipient', foreignKey: 'recipientId' });
    };

    return ChatMessage;
};