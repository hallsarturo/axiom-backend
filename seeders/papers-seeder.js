import fs from 'fs';

export async function up(queryInterface, Sequelize) {
    const postsData = JSON.parse(
        fs.readFileSync('data/phil-papers/posts.json', 'utf-8')
    );

    // Map your JSON fields to match your posts table structure
    const paperPosts = postsData.map(post => ({
        type: 'paper',
        title: post.title,
        description: post.description,
        abstract: post.description, // or another field if available
        content: post.description,  // or another field if available
        image: null,                // or set if you have an image field
        identifier: post.identifier,
        author: Array.isArray(post.creator) ? post.creator.join(', ') : post.creator,
        subject: post.subject,
        publishedAt: post.datestamp ? new Date(post.datestamp) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert('posts', paperPosts);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts', { type: 'paper' });
}