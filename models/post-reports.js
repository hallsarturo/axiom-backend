export default (sequelize, DataTypes) => {
    const PostReport = sequelize.define(
        'post_reports',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: { type: DataTypes.INTEGER, allowNull: false },
            userId: { type: DataTypes.INTEGER, allowNull: false },
            reason: { type: DataTypes.STRING, allowNull: true },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        { timestamps: false }
    );

    PostReport.associate = (db) => {
        PostReport.belongsTo(db.posts, { foreignKey: 'postId' });
        PostReport.belongsTo(db.users, { foreignKey: 'userId' });
    };

    return PostReport;
};
