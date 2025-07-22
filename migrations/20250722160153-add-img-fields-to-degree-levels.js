export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('degree_levels', 'imgSrc', {
            type: Sequelize.STRING,
            allowNull: false,
        });
        await queryInterface.addColumn('degree_levels', 'imgAlt', {
            type: Sequelize.STRING(50),
            allowNull: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('degree_levels', 'imgSrc');
        await queryInterface.removeColumn('degree_levels', 'imgAlt');
    },
};
