export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('comment_reactions', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        commentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'post_comments',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        reaction: {
            type: Sequelize.ENUM('like', 'dislike', 'laugh', 'anger'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('comment_reactions');
}