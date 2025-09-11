export default (sequelize, DataTypes) => {
    const PostBookmark = sequelize.define(
        'post_bookmarks',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        { timestamps: false }
    );

    PostBookmark.associate = (db) => {
        PostBookmark.belongsTo(db.posts, {
            foreignKey: 'postId',
            onDelete: 'CASCADE',
        });
        PostBookmark.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostBookmark;
};
