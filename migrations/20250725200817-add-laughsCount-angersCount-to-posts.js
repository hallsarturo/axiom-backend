export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'laughsCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
    await queryInterface.addColumn('posts', 'angersCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('posts', 'laughsCount');
    await queryInterface.removeColumn('posts', 'angersCount');
}