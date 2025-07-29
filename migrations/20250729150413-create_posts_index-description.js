export async function up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
        `CREATE INDEX posts_description_fts_idx ON posts USING GIN (to_tsvector('english', description));`
    );
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS posts_description_fts_idx;`
    );
}