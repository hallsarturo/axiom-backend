export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'userProfilePic', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Relative path to user profile picture',
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'userProfilePic');
}