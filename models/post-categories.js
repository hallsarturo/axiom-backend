export default (sequelize, DataTypes) => {
    const PostCategory = sequelize.define(
        'post_categories',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            postId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            confidence_score: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
        },
        { timestamps: false }
    );

    PostCategory.associate = (db) => {
        PostCategory.belongsTo(db.posts, { foreignKey: 'postId' });
        PostCategory.belongsTo(db.philarchive_categories, { foreignKey: 'categoryId' });
    };

    return PostCategory;
};