export async function up(queryInterface) {
    await queryInterface.dropTable('subcategories');
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.createTable('subcategories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        // timestamps: false
    });
}