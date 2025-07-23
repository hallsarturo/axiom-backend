export default (sequelize, DataTypes) => {
    const Agency = sequelize.define(
        'agencies',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: { type: DataTypes.STRING, allowNull: false, unique: true },
        },
        { timestamps: false }
    );

    Agency.associate = (db) => {
        Agency.hasMany(db.posts, { foreignKey: 'agency' });
    };

    return Agency;
};
