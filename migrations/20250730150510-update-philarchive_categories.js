export async function up(queryInterface, DataTypes) {
    await queryInterface.createTable('philarchive_categories', {
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
            references: {
                model: 'philarchive_categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('philarchive_categories');
}
