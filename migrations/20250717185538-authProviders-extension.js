export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_providers', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        provider: { type: Sequelize.STRING(50), allowNull: false },
        providerId: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING, allowNull: true },
        displayName: { type: Sequelize.STRING, allowNull: true },
        familyName: { type: Sequelize.STRING, allowNull: true },
        givenName: { type: Sequelize.STRING, allowNull: true },
        photoUrl: { type: Sequelize.STRING, allowNull: true },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });
}
