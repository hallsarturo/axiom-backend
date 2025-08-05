export default (sequelize, DataTypes) => {
    const Subject = sequelize.define(
        'subjects',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            interestAreaId: { type: DataTypes.INTEGER, allowNull: false },
            name: { type: DataTypes.STRING(100), allowNull: false },
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

    Subject.associate = (db) => {
        Subject.belongsTo(db.interest_areas, { foreignKey: 'interestAreaId' });
        //Subject.hasMany(db.user_preferences, { foreignKey: 'subjectId' });
    };

    return Subject;
};
