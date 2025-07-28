// migrations/20250728-add-oai-fields.js
export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'datestamp', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'oai_dc_dc', { type: Sequelize.JSONB, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_title', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_type', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_creator', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_subject', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_date', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_identifier', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_language', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'dc_description', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('posts', 'about', { type: Sequelize.JSONB, allowNull: true });
    await queryInterface.addColumn('posts', 'rights', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('posts', 'rightsReference', { type: Sequelize.STRING, allowNull: true });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn('posts', 'identifier');
    await queryInterface.removeColumn('posts', 'datestamp');
    await queryInterface.removeColumn('posts', 'oai_dc_dc');
    await queryInterface.removeColumn('posts', 'dc_title');
    await queryInterface.removeColumn('posts', 'dc_type');
    await queryInterface.removeColumn('posts', 'dc_creator');
    await queryInterface.removeColumn('posts', 'dc_subject');
    await queryInterface.removeColumn('posts', 'dc_date');
    await queryInterface.removeColumn('posts', 'dc_identifier');
    await queryInterface.removeColumn('posts', 'dc_language');
    await queryInterface.removeColumn('posts', 'dc_description');
    await queryInterface.removeColumn('posts', 'about');
    await queryInterface.removeColumn('posts', 'rights');
    await queryInterface.removeColumn('posts', 'rightsReference');
}