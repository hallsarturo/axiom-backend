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
