export default (sequelize, DataTypes) => {
    const PostInterest = sequelize.define(
        'post_interests',
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            interest: {
                type: DataTypes.ENUM('interesting', 'not_interesting'),
                allowNull: false,
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        },
        { timestamps: false }
    );

    PostInterest.associate = (db) => {
        PostInterest.belongsTo(db.posts, { foreignKey: 'postId' });
        PostInterest.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostInterest;
};