export default (sequelize, DataTypes) => {
    const UserCategoryPreference = sequelize.define('user_category_preferences', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        categoryId: { type: DataTypes.INTEGER, allowNull: false },
        philarchiveCategoryId: { type: DataTypes.INTEGER, allowNull: true },
    }, { timestamps: false });

    UserCategoryPreference.associate = (db) => {
        UserCategoryPreference.belongsTo(db.users, { foreignKey: 'userId' });
        UserCategoryPreference.belongsTo(db.categories, { foreignKey: 'categoryId' });
        UserCategoryPreference.belongsTo(db.philarchive_categories, { foreignKey: 'philarchiveCategoryId' });
    };

    return UserCategoryPreference;
};