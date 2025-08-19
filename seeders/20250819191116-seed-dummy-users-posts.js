import { faker } from '@faker-js/faker';

export async function up(queryInterface) {
    const users = [];
    const posts = [];
    const password = faker.internet.password({ length: 12 });

    for (let i = 0; i < 10; i++) {
        const username = faker.person.fullName().toLowerCase();
        const email = faker.internet.email();
        users.push({
            username,
            email,
            password,
            isVerified: true,
            about: faker.lorem.paragraph(),
            userProfilePic: faker.image.avatar(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    await queryInterface.bulkInsert('users', users);

    // Fetch inserted users to get their IDs
    const insertedUsers = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id DESC LIMIT 10',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const user of insertedUsers) {
        const numPosts = faker.number.int({ min: 10, max: 25 });
        for (let j = 0; j < numPosts; j++) {
            posts.push({
                userId: user.id,
                type: 'user',
                title: faker.lorem.sentence({ min: 5, max: 12 }),
                description: faker.lorem.paragraphs(2),
                author: faker.person.fullName(),
                image: faker.image.urlPicsumPhotos(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    await queryInterface.bulkInsert('posts', posts);
}

export async function down(queryInterface) {
    await queryInterface.bulkDelete('posts', { type: 'user' });
    // Optionally delete users
}
