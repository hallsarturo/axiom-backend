export default (sequelize, DataTypes) => {
    const PostLike = sequelize.define(
        'post_likes',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            type: {
                type: DataTypes.ENUM(
                    'like',
                    'dislike',
                    'interesting',
                    'not_interesting',
                    'bookmark'
                ),
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

    PostLike.associate = (db) => {
        PostLike.belongsTo(db.posts, { foreignKey: 'postId' });
        PostLike.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostLike;
};
