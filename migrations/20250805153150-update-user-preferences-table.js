export async function up(queryInterface, Sequelize) {
    // Remove subcategoryId column if it exists
    await queryInterface.removeColumn('user_preferences', 'subcategoryId');

    // Add subjectId column
    await queryInterface.addColumn('user_preferences', 'subjectId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'subjects',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'References subject for user preference',
    });

    // Add degreeLevelId column
    await queryInterface.addColumn('user_preferences', 'degreeLevelId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'degree_levels',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'References degree level for user preference',
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_preferences', 'degreeLevelId');
    await queryInterface.removeColumn('user_preferences', 'subjectId');
    await queryInterface.addColumn('user_preferences', 'subcategoryId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'References subcategory for user preference',
    });
}
