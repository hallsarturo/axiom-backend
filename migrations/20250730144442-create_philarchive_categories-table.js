export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('philarchive_categories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        level: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        parent_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'philarchive_categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        path: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        href: {
            type: Sequelize.STRING(255),
            allowNull: true,
        }
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('philarchive_categories');
}