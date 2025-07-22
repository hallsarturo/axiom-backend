export default (sequelize, DataTypes) => {
  const Categories = sequelize.define('categories', {
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
  }, {
    timestamps: false,
  });

  Categories.associate = (db) => {
   
  };

  return Categories;
};