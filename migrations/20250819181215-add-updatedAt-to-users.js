export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Date when the user account was last updated',
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('users', 'updatedAt');
}