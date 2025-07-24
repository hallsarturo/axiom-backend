export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('post_shares', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        sharedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        // Optionally, you can add a "platform" field if you want to track where it was shared
        // platform: { type: Sequelize.STRING, allowNull: true },
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('post_shares');
}