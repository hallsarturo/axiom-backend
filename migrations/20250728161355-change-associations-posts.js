export async function up(queryInterface, Sequelize) {
    // Remove existing foreign key constraint if it exists
    await queryInterface.removeConstraint('post_reactions', 'post_reactions_postId_fkey').catch(() => {});

    // Add new foreign key constraint with ON DELETE CASCADE
    await queryInterface.addConstraint('post_reactions', {
        fields: ['postId'],
        type: 'foreign key',
        name: 'post_reactions_postId_fkey',
        references: {
            table: 'posts',
            field: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}

export async function down(queryInterface, Sequelize) {
    // Remove the cascade constraint
    await queryInterface.removeConstraint('post_reactions', 'post_reactions_postId_fkey').catch(() => {});

    // Re-add the original constraint without cascade (default RESTRICT)
    await queryInterface.addConstraint('post_reactions', {
        fields: ['postId'],
        type: 'foreign key',
        name: 'post_reactions_postId_fkey',
        references: {
            table: 'posts',
            field: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    });
}