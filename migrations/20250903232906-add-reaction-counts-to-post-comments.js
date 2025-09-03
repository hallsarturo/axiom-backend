'use strict';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('post_comments', 'totalReactions', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('post_comments', 'totalReactions');
}
