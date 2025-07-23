export default (sequelize, DataTypes) => {
    const Comment = sequelize.define('comments', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        postId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { timestamps: false });

    Comment.associate = (db) => {
        Comment.belongsTo(db.posts, { foreignKey: 'postId' });
        Comment.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return Comment;
};