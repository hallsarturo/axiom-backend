export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_preferences', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            degreeLevelId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'degree_levels', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            subjectId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'subjects', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('user_preferences');
    },
};
