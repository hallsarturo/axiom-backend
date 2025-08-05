export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
        },
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
}