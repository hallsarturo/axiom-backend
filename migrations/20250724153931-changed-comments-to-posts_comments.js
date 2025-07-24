export async function up(queryInterface, Sequelize) {
    await queryInterface.renameTable('comments', 'post_comments');
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.renameTable('post_comments', 'comments');
}