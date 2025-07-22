export async function up(queryInterface, Sequelize) {
    // Find interest area IDs for "Science" and "Humanities"
    const [science] = await queryInterface.sequelize.query(
        `SELECT id FROM interest_areas WHERE name = 'Science' LIMIT 1;`,
        { type: Sequelize.QueryTypes.SELECT }
    );
    const [humanities] = await queryInterface.sequelize.query(
        `SELECT id FROM interest_areas WHERE name = 'Humanities' LIMIT 1;`,
        { type: Sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('subjects', [
        {
            name: 'Physics',
            interestAreaId: science?.id,
            imgSrc: 'public/dashboard/physics.jpg',
            imgAlt: 'Physics',
        },
        {
            name: 'Philosophy',
            interestAreaId: humanities?.id,
            imgSrc: '/dashboard/philosophy.jpg',
            imgAlt: 'Philosophy',
        },
    ]);
}

export async function down(queryInterface) {
    await queryInterface.bulkDelete('subjects', {
        name: ['Physics', 'Philosophy'],
    });
}