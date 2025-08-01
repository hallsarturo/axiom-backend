export async function up(queryInterface, Sequelize) {
    // Column already exists, only create the index
    await queryInterface.sequelize.query(
        `CREATE INDEX users_about_idx ON users USING GIN (to_tsvector('english', about));`
    );
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS users_about_idx;`
    );
    await queryInterface.removeColumn('users', 'about');
}