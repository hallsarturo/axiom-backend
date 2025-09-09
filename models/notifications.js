export default (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        'notifications',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            senderId: {
                type: DataTypes.INTEGER,
                allowNull: true, // System notifications might not have a sender
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false,
                // e.g., 'follow', 'like', 'comment', 'mention', 'message'
            },
            entityId: {
                type: DataTypes.INTEGER,
                allowNull: true, // ID of related entity (post, comment, etc.)
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
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
        },
        { timestamps: false }
    );

    Notification.associate = (db) => {
        Notification.belongsTo(db.users, { foreignKey: 'userId' });
        Notification.belongsTo(db.users, {
            as: 'sender',
            foreignKey: 'senderId',
        });
    };

    return Notification;
};
