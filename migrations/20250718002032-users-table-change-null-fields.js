export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('users', 'mobilePhone', {
    type: Sequelize.STRING(20),
    allowNull: true,
    unique: true,
  });
  await queryInterface.changeColumn('users', 'password', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('users', 'mobilePhone', {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: true,
  });
  await queryInterface.changeColumn('users', 'password', {
    type: Sequelize.STRING(255),
    allowNull: false,
  });
}