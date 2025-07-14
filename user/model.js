import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: 'localhost',
        dialect: 'postgres',
    }
);

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

// export async function get(username, password, cb) {
//     try {
//         const user = await Users.findOne({
//             where: { username },
//         });
//         if (!user) {
//             return cb(null, false, { message: 'No username found' });
//         }
//         const match = await bcrypt.compare(password, user.password);
//         if (!match) {
//             return cb(null, false, {
//                 message: 'Incorrect username or password',
//             });
//         } else {
//             return cb(null, user);
//         }
//     } catch (err) {
//         return cb(err);
//     }
// }

export async function findUserByUsername(username, password) {
    try {
        const user = await Users.findOne({
            where: { username },
        });
        if (!user) {
            console.log('no username found');
            return 0;
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('incorrect username or password');
            return 2;
        } else {
            return user;
        }
    } catch (err) {
        return err;
    }
}

export async function findUserById(id) {
    try {
        const user = await Users.findByPk(id);
        if (!user) {
            return null;
        }
        return user;
    } catch (err) {
        console.error(err);
    }
}

export async function createUser(username, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await Users.create({
            username: username,
            password: hashedPassword,
        });
        return user;
    } catch (err) {
        return err;
    }
}
