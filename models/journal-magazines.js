export default (sequelize, DataTypes) => {
    const Magazine = sequelize.define('journal_magazines', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { timestamps: false });

    Magazine.associate = (db) => {
        Magazine.hasMany(db.posts, { foreignKey: 'magazine' });
    };

    return Magazine;
};