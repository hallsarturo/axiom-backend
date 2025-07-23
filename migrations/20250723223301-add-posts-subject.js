export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'subject', {
        type: Sequelize.STRING,
        allowNull: true,
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('posts', 'subject');
}