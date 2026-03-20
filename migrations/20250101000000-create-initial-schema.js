export async function up(queryInterface, Sequelize) {
    // 1. users
    await queryInterface.createTable('users', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        username: {
            type: Sequelize.STRING(50),
            allowNull: false,
            unique: true,
        },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        mobilePhone: {
            type: Sequelize.STRING(20),
            allowNull: true,
            unique: true,
        },
        password: { type: Sequelize.STRING(255), allowNull: true },
        isVerified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        about: { type: Sequelize.TEXT, allowNull: true },
        userProfilePic: { type: Sequelize.STRING(255), allowNull: true },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 2. auth_providers
    await queryInterface.createTable('auth_providers', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
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
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 3. degree_levels
    await queryInterface.createTable('degree_levels', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        imgSrc: { type: Sequelize.STRING, allowNull: false },
        imgAlt: { type: Sequelize.STRING(50), allowNull: false },
    });

    // 4. categories
    await queryInterface.createTable('categories', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    });

    // 5. philarchive_categories
    await queryInterface.createTable('philarchive_categories', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        level0: { type: Sequelize.STRING(255), allowNull: true },
        level1: { type: Sequelize.STRING(255), allowNull: true },
        level2: { type: Sequelize.STRING(255), allowNull: true },
        level3: { type: Sequelize.STRING(255), allowNull: true },
        level4: { type: Sequelize.STRING(255), allowNull: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        parent_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'philarchive_categories', key: 'id' },
        },
    });

    // 6. posts
    await queryInterface.createTable('posts', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        type: {
            type: Sequelize.ENUM('user', 'news', 'paper'),
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
        },
        agency: { type: Sequelize.STRING, allowNull: true },
        magazine: { type: Sequelize.STRING, allowNull: true },
        university: { type: Sequelize.STRING, allowNull: true },
        title: { type: Sequelize.TEXT, allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        abstract: { type: Sequelize.TEXT, allowNull: true },
        content: { type: Sequelize.TEXT, allowNull: true },
        image: { type: Sequelize.STRING, allowNull: true },
        publishedAt: { type: Sequelize.DATE, allowNull: true },
        likesCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        dislikesCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        laughsCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        angersCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        interestingCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        notInterestingCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        totalReactions: { type: Sequelize.INTEGER, defaultValue: 0 },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 7. post_comments
    await queryInterface.createTable('post_comments', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        content: { type: Sequelize.TEXT, allowNull: false },
        parentCommentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'post_comments', key: 'id' },
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        likesCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        dislikesCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        laughsCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        angersCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        totalReactions: { type: Sequelize.INTEGER, defaultValue: 0 },
    });

    // 8. post_reactions
    await queryInterface.createTable('post_reactions', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        reaction: {
            type: Sequelize.ENUM('like', 'dislike', 'laugh', 'anger'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 9. post_bookmarks
    await queryInterface.createTable('post_bookmarks', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 10. post_shares
    await queryInterface.createTable('post_shares', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        sharedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 11. post_categories
    await queryInterface.createTable('post_categories', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'philarchive_categories', key: 'id' },
        },
        confidence_score: { type: Sequelize.FLOAT, allowNull: true },
    });

    // 12. post_reports
    await queryInterface.createTable('post_reports', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        reason: { type: Sequelize.STRING, allowNull: true },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 13. post_interests
    await queryInterface.createTable('post_interests', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'posts', key: 'id' },
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        interest: {
            type: Sequelize.ENUM('interesting', 'not_interesting'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 14. comment_reactions
    await queryInterface.createTable('comment_reactions', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        commentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'post_comments', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        reaction: {
            type: Sequelize.ENUM('like', 'dislike', 'laugh', 'anger'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 15. user_preferences
    await queryInterface.createTable('user_preferences', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        degreeLevelId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'degree_levels', key: 'id' },
        },
    });

    // 16. user_category_preferences
    await queryInterface.createTable('user_category_preferences', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' },
        },
        philarchiveCategoryId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'philarchive_categories', key: 'id' },
        },
    });

    // 17. user_followers
    await queryInterface.createTable('user_followers', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        followerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        followingId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 18. notifications
    await queryInterface.createTable('notifications', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        senderId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
        },
        type: { type: Sequelize.STRING(50), allowNull: false },
        entityId: { type: Sequelize.INTEGER, allowNull: true },
        content: { type: Sequelize.TEXT, allowNull: true },
        isRead: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 19. chat_messages
    await queryInterface.createTable('chat_messages', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        senderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        recipientId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        content: { type: Sequelize.TEXT, allowNull: false },
        isRead: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    });

    // 20. session (for connect-pg-simple)
    await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "session" (
            "sid" varchar NOT NULL COLLATE "default",
            "sess" json NOT NULL,
            "expire" timestamp(6) NOT NULL,
            CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('user_followers');
    await queryInterface.dropTable('user_category_preferences');
    await queryInterface.dropTable('user_preferences');
    await queryInterface.dropTable('comment_reactions');
    await queryInterface.dropTable('post_interests');
    await queryInterface.dropTable('post_reports');
    await queryInterface.dropTable('post_categories');
    await queryInterface.dropTable('post_shares');
    await queryInterface.dropTable('post_bookmarks');
    await queryInterface.dropTable('post_reactions');
    await queryInterface.dropTable('post_comments');
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('philarchive_categories');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('degree_levels');
    await queryInterface.dropTable('auth_providers');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('session');
}
