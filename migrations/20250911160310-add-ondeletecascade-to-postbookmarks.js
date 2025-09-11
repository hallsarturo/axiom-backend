export async function up(queryInterface) {
    await queryInterface.removeConstraint(
        'post_bookmarks',
        'post_bookmarks_postId_fkey'
    );
    await queryInterface.addConstraint('post_bookmarks', {
        fields: ['postId'],
        type: 'foreign key',
        name: 'post_bookmarks_postId_fkey',
        references: {
            table: 'posts',
            field: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}

export async function down(queryInterface) {
    await queryInterface.removeConstraint(
        'post_bookmarks',
        'post_bookmarks_postId_fkey'
    );
    await queryInterface.addConstraint('post_bookmarks', {
        fields: ['postId'],
        type: 'foreign key',
        name: 'post_bookmarks_postId_fkey',
        references: {
            table: 'posts',
            field: 'id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
}
