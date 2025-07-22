export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('subcategories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subcategories');
}
