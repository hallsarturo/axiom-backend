export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('post_bookmarks', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'posts', key: 'id' } },
        userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
}
export async function down(queryInterface) {
    await queryInterface.dropTable('post_bookmarks');
}