export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('post_categories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'philarchive_categories', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        confidence_score: {
            type: Sequelize.FLOAT,
            allowNull: true,
        },
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable('post_categories');
}