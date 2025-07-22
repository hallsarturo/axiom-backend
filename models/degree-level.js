export default (sequelize, DataTypes) => {
    const DegreeLevel = sequelize.define(
        'degree_levels',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            imgSrc: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            imgAlt: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
        },
        { timestamps: false }
    );

    DegreeLevel.associate = (db) => {
        DegreeLevel.hasMany(db.user_preferences, {
            foreignKey: 'degreeLevelId',
        });
    };

    return DegreeLevel;
};

// helper funcitons

