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
    };

    return PostComment;
};
