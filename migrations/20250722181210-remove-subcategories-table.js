export async function up(queryInterface, Sequelize) {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint('user_preferences', 'user_preferences_subcategoryId_fkey');
    // Now drop the table
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
    // You may need to re-add the foreign key constraint in down migration if needed
}
