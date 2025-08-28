export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('post_comments', 'parentCommentId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'post_comments',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'If set, this comment is a reply to another comment',
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('post_comments', 'parentCommentId');
}