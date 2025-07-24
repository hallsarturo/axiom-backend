export default (sequelize, DataTypes) => {
    const PostShare = sequelize.define(
        'post_shares',
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            sharedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            // platform: { type: DataTypes.STRING, allowNull: true }, // optional
        },
        { timestamps: false }
    );

    PostShare.associate = (db) => {
        PostShare.belongsTo(db.posts, { foreignKey: 'postId' });
        PostShare.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostShare;
};