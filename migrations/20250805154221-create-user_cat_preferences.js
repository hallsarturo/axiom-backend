export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_category_preferences', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' },
            onDelete: 'CASCADE',
        },
        philarchiveCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'philarchive_categories', key: 'id' },
            onDelete: 'SET NULL',
        },
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_category_preferences');
}