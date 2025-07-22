export async function up(queryInterface, Sequelize) {
    // Change timestamps to false (remove createdAt, updatedAt)
    await queryInterface.removeColumn('categories', 'createdAt');
    await queryInterface.removeColumn('categories', 'updatedAt');
    await queryInterface.removeColumn('subcategories', 'createdAt');
    await queryInterface.removeColumn('subcategories', 'updatedAt');
    await queryInterface.removeColumn('user_preferences', 'createdAt');
    await queryInterface.removeColumn('user_preferences', 'updatedAt');

    // Add imgSrc and imgAlt to subcategories
    await queryInterface.addColumn('subcategories', 'imgSrc', {
        type: Sequelize.STRING,
        allowNull: true,
    });
    await queryInterface.addColumn('subcategories', 'imgAlt', {
        type: Sequelize.STRING(50),
        allowNull: true,
    });
}

export async function down(queryInterface, Sequelize) {
    // Re-add timestamps
    await queryInterface.addColumn('categories', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.addColumn('categories', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.addColumn('subcategories', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.addColumn('subcategories', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.addColumn('user_preferences', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    await queryInterface.addColumn('user_preferences', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    // Remove imgSrc and imgAlt from subcategories
    await queryInterface.removeColumn('subcategories', 'imgSrc');
    await queryInterface.removeColumn('subcategories', 'imgAlt');
}
