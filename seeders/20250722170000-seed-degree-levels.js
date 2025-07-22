export async function up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('degree_levels', [
        {
            name: 'Student',
            imgSrc: 'public/dashboard/student.jpg',
            imgAlt: 'Student',
        },
        {
            name: 'Enthusiast',
            imgSrc: 'public/dashboard/enthusiast.jpg',
            imgAlt: 'Enthusiast',
        },
        {
            name: 'Researcher/Profesor',
            imgSrc: 'public/dashboard/profesor.jpg',
            imgAlt: 'Researcher/Profesor',
        },
    ]);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('degree_levels', null, {});
}
