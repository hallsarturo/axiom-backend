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
            allowNull: false,
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

export async function get(username, password, cb) {
    try {
        const user = await Users.findOne({
            where: { username },
        });
        if (!user) {
            return cb(null, false, { message: 'No username found' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return cb(null, false, {
                message: 'Incorrect username or password',
            });
        } else {
            return cb(null, user);
        }
    } catch (err) {
        return cb(err);
    }
}
