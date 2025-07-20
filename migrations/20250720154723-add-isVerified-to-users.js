export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'isVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'isVerified');
}
