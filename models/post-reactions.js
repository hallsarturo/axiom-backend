export default (sequelize, DataTypes) => {
    const PostReaction = sequelize.define(
        'post_reactions',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: { type: DataTypes.INTEGER, allowNull: false },
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

    PostReaction.associate = (db) => {
        PostReaction.belongsTo(db.posts, { foreignKey: 'postId' });
        PostReaction.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostReaction;
};
