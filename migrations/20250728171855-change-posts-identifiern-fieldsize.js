export async function up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'identifier', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'dc_identifier', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'author', {
        type: Sequelize.TEXT,
        allowNull: true,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'identifier', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'dc_identifier', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
    await queryInterface.changeColumn('posts', 'author', {
        type: Sequelize.STRING(255),
        allowNull: true,
    });
}