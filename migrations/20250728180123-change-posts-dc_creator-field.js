export async function up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'dc_creator', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'dc_creator', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
}
