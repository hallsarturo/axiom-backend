export default (sequelize, DataTypes) => {
    const UserPreference = sequelize.define(
        'user_preferences',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            degreeLevelId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            subjectId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    );

    UserPreference.associate = (db) => {
        UserPreference.belongsTo(db.users, { foreignKey: 'userId' });
        UserPreference.belongsTo(db.degree_levels, {
            foreignKey: 'degreeLevelId',
        });
        UserPreference.belongsTo(db.subjects, { foreignKey: 'subjectId' });
    };

    return UserPreference;
};
