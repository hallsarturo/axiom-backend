'use strict';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('post_comments', 'likesCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
    await queryInterface.addColumn('post_comments', 'dislikesCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
    await queryInterface.addColumn('post_comments', 'laughsCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
    await queryInterface.addColumn('post_comments', 'angersCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('post_comments', 'likesCount');
    await queryInterface.removeColumn('post_comments', 'dislikesCount');
    await queryInterface.removeColumn('post_comments', 'laughsCount');
    await queryInterface.removeColumn('post_comments', 'angersCount');
}