export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('comments', {
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
        content: { type: Sequelize.TEXT, allowNull: false },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comments');
}