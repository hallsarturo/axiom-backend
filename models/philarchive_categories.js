export default (sequelize, DataTypes) => {
    const PhilarchiveCategory = sequelize.define(
        'philarchive_categories',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            level0: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            level1: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            level2: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            level3: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            level4: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            parent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            timestamps: false,
        }
    );

    PhilarchiveCategory.associate = (db) => {
        PhilarchiveCategory.belongsTo(db.philarchive_categories, {
            as: 'parent',
            foreignKey: 'parent_id',
        });
        PhilarchiveCategory.hasMany(db.philarchive_categories, {
            as: 'children',
            foreignKey: 'parent_id',
        });
    };

    return PhilarchiveCategory;
};
