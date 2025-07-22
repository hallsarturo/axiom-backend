export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('subjects', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            interestAreaId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'interest_areas', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            name: { type: Sequelize.STRING(100), allowNull: false },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('subjects');
    },
};
