export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('degree_levels', {
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
    },
    async down(queryInterface) {
        await queryInterface.dropTable('degree_levels');
    },
};
