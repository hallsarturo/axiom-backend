export async function up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pending_signups', 'verificationCode');
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.addColumn('pending_signups', 'verificationCode', {
        type: Sequelize.STRING(10),
        allowNull: false,
    });
}
