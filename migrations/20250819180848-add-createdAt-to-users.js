export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Date when the user account was created',
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('users', 'createdAt');
}