import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

const sequelize = new Sequelize('philo-net-db', 'postgres', 'topSecret', {
    host: 'localhost',
    dialect: 'postgres',
});

// Test db connection

try {
    await sequelize.authenticate();
    console.log('Conection to PostgreSQL has been established successfully');
} catch (err) {
    console.error('Unable to conecto to PostgreSQL: ', err);
}

// Define User model

const Users = sequelize.define(
    'users',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(255),
            allowNUll: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

export async function get(query = {}) {
    const user = await Users.findOne({ where: { username: query.username } });
    if (!user) return null;

    const match = await bcrypt.compare(query.password, user.password);
    if (!match) return null;

    return user;
}
