import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notifications', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add index for faster lookup of a user's notifications
  await queryInterface.addIndex('notifications', ['userId', 'createdAt']);
  await queryInterface.addIndex('notifications', ['userId', 'isRead']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('notifications');
}