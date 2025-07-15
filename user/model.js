import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import parsePhoneNumber from 'libphonenumber-js';
import config from '../config/config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
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
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: {
                    args: [6, 50],
                    msg: 'Username must be between 6 and 50 characters',
                },
                isLowercase(value) {
                    if (value !== value.toLowerCase()) {
                        throw new Error('Username must be lowercase');
                    }
                },
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Invalid email address',
                },
            },
        },
        mobilePhone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                async isValidPhone(value) {
                    const phone = parsePhoneNumber(value);
                    if (!phone?.isValid()) {
                        throw new Error('Invalid phone number');
                    }
                },
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: {
                    args: [6, 50],
                    msg: 'Password must be between 6 and 50 characters',
                },
            },
        },
    },
    {
        timestamps: false,
    }
);

export async function findUserByUsername(userData) {
    try {
        const user = await Users.findOne({
            where: { username: userData.username },
        });
        if (!user) {
            console.log('no username found');
            return 0;
        }
        const match = await bcrypt.compare(userData.password, user.password);
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

export async function findUserById(userData) {
    try {
        const user = await Users.findByPk(userData.id);
        if (!user) {
            return null;
        }
        return user;
    } catch (err) {
        console.error(err);
    }
}

export async function createUser(userData) {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await Users.create({
            username: userData.username,
            email: userData.email,
            mobilePhone: userData.mobilePhone,
            password: hashedPassword,
        });
        return user;
    } catch (err) {
        return err;
    }
}
