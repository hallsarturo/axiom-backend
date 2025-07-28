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
            laughsCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            angersCount: {
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
            identifier: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            author: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            subject: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            datestamp: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            oai_dc_dc: {
                type: DataTypes.JSONB, // Stores the full oai_dc:dc object
                allowNull: true,
            },
            dc_title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_creator: {
                type: DataTypes.STRING, // Store as comma-separated string or JSON string if array
                allowNull: true,
            },
            dc_subject: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_date: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_identifier: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_language: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            dc_description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            about: {
                type: DataTypes.JSONB, // Stores the full about object
                allowNull: true,
            },
            rights: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            rightsReference: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            validate: {
                identifierAndAuthorRequiredForPaper() {
                    if (this.type === 'paper') {
                        if (!this.identifier) {
                            throw new Error(
                                'identifier is required for paper posts'
                            );
                        }
                        if (!this.author) {
                            throw new Error(
                                'author is required for paper posts'
                            );
                        }
                    }
                },
            },
        }
    );

    Post.associate = (db) => {
        Post.belongsTo(db.users, { foreignKey: 'userId' });
        Post.hasMany(db.post_reactions, { foreignKey: 'postId', onDelete: 'CASCADE' });
        // Add associations for comments, likes, etc. as you implement those tables
    };

    return Post;
};
