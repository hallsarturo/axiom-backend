export async function up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'title', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'dc_title', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'title', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'dc_title', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
}