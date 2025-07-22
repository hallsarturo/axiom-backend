export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subjects', 'imgSrc', {
        type: Sequelize.STRING,
        allowNull: false,
    });
    await queryInterface.addColumn('subjects', 'imgAlt', {
        type: Sequelize.STRING(50),
        allowNull: false,
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('subjects', 'imgSrc');
    await queryInterface.removeColumn('subjects', 'imgAlt');
}
