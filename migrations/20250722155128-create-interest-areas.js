export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('interest_areas', {
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
        await queryInterface.dropTable('interest_areas');
    },
};
