export async function up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'mobilePhone', {
        type: Sequelize.STRING(20),
        allowNull: false,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'mobilePhone', {
        type: Sequelize.STRING(255),
        allowNull: false,
    });
}
