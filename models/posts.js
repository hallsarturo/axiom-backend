export default (sequelize, DataTypes) => {
    const Post = sequelize.define(
        'posts',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            type: {
                type: DataTypes.ENUM('user', 'news', 'paper'),
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            agency: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            magazine: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            university: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            abstract: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            publishedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            likesCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            dislikesCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            commentsCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            sharesCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        },
        {
            timestamps: true,
        }
    );

    Post.associate = (db) => {
        Post.belongsTo(db.users, { foreignKey: 'userId' });
        // Add associations for comments, likes, etc. as you implement those tables
    };

    return Post;
};
