export default (sequelize, DataTypes) => {
    const InterestArea = sequelize.define(
        'interest_areas',
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
        },
        { timestamps: false }
    );

    InterestArea.associate = (db) => {
        InterestArea.hasMany(db.subjects, { foreignKey: 'interestAreaId' });
    };

    return InterestArea;
};
