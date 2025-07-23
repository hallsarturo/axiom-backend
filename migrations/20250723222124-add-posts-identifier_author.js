export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'identifier', {
        type: Sequelize.STRING,
        allowNull: true, // DB-level, app-level validation will enforce not null for 'paper'
    });
    await queryInterface.addColumn('posts', 'author', {
        type: Sequelize.STRING,
        allowNull: true,
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('posts', 'identifier');
    await queryInterface.removeColumn('posts', 'author');
}