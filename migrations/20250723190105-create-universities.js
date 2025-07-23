export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('universities', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
    });
}
export async function down(queryInterface) {
    await queryInterface.dropTable('universities');
}