export async function up(queryInterface, Sequelize) {
    await queryInterface.addIndex('posts', ['title']);
    await queryInterface.addIndex('posts', ['author']);
    await queryInterface.addIndex('posts', ['subject']);
    await queryInterface.addIndex('posts', ['identifier']);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('posts', ['title']);
    await queryInterface.removeIndex('posts', ['author']);
    await queryInterface.removeIndex('posts', ['subject']);
    await queryInterface.removeIndex('posts', ['identifier']);
}