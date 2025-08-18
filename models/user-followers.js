export default (sequelize, DataTypes) => {
    const UserFollower = sequelize.define(
        'user_followers',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            followerId: { type: DataTypes.INTEGER, allowNull: false }, // The user who follows
            followingId: { type: DataTypes.INTEGER, allowNull: false }, // The user being followed
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        { timestamps: false }
    );

    UserFollower.associate = (db) => {
        UserFollower.belongsTo(db.users, {
            as: 'follower',
            foreignKey: 'followerId',
        });
        UserFollower.belongsTo(db.users, {
            as: 'following',
            foreignKey: 'followingId',
        });
    };

    return UserFollower;
};