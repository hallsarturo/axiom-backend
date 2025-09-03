export default (sequelize, DataTypes) => {
    const CommentReaction = sequelize.define(
        'comment_reactions',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            commentId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            reaction: {
                type: DataTypes.ENUM('like', 'dislike', 'laugh', 'anger'),
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        { timestamps: false }
    );

    CommentReaction.associate = (db) => {
        CommentReaction.belongsTo(db.post_comments, {
            foreignKey: 'commentId',
        });
        CommentReaction.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return CommentReaction;
};
