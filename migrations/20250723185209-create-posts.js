export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: Sequelize.ENUM('user', 'news', 'paper'),
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        agency: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        magazine: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        university: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        abstract: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        image: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        publishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        likesCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        dislikesCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        commentsCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        sharesCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
}