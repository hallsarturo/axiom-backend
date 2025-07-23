export default (sequelize, DataTypes) => {
    const University = sequelize.define(
        'universities',
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

    University.associate = (db) => {
        University.hasMany(db.posts, { foreignKey: 'university' });
    };

    return University;
};
