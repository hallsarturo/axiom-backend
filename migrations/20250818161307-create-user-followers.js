export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_followers', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        followerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },
        followingId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('user_followers');
}
