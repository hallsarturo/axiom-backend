export default (sequelize, DataTypes) => {
    const PostComment = sequelize.define(
        'post_comments',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            content: { type: DataTypes.TEXT, allowNull: false },
            parentCommentId: {
                type: DataTypes.INTEGER,
                allowNull: true, // null means top-level comment
                references: { model: 'post_comments', key: 'id' },
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            likesCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            dislikesCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            laughsCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            angersCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            totalReactions: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        },
        { timestamps: false }
    );

    PostComment.associate = (db) => {
        PostComment.belongsTo(db.posts, { foreignKey: 'postId' });
        PostComment.belongsTo(db.users, { foreignKey: 'userId' });
        PostComment.belongsTo(db.post_comments, {
            as: 'parent',
            foreignKey: 'parentCommentId',
        });
        PostComment.hasMany(db.post_comments, {
            as: 'replies',
            foreignKey: 'parentCommentId',
        });
    };

    return PostComment;
};
