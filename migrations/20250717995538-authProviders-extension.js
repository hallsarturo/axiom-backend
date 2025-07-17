export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('auth_providers', 'displayName', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('auth_providers', 'familyName', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('auth_providers', 'givenName', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('auth_providers', 'photoUrl', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('auth_providers', 'displayName');
  await queryInterface.removeColumn('auth_providers', 'familyName');
  await queryInterface.removeColumn('auth_providers', 'givenName');
  await queryInterface.removeColumn('auth_providers', 'photoUrl');
}