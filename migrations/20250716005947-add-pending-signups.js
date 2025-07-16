export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('pending_signups', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: Sequelize.STRING(50),
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        mobilePhone: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        verificationCode: {
            type: Sequelize.STRING(10),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pending_signups');
}
