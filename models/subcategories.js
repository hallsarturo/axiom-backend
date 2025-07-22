export default (sequelize, DataTypes) => {
    const Subcategories = sequelize.define(
        'subcategories',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            imgSrc: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            imgAlt: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    );

    Subcategories.associate = (db) => {
        Subcategories.belongsTo(db.categories, { foreignKey: 'categoryId' });
        Subcategories.hasMany(db.user_preferences, {
            foreignKey: 'subcategoryId',
        });
    };

    return Subcategories;
};
