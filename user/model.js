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
            unique: {
                msg: 'The username is already in use.',
            },
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
            unique: {
                msg: 'The email address is already in use.',
            },
            validate: {
                isEmail: {
                    msg: 'Invalid email address',
                },
            },
        },
        mobilePhone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: {
                msg: 'This phone number is already in use',
            },
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
        },
    },
    {
        timestamps: false,
    }
);

// Define PendingSignups
const PendingSignups = sequelize.define(
    'pending_signups',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mobilePhone: {
            type: DataTypes.STRING,
            allowNull: false,
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

// Define authProviders
const AuthProviders = sequelize.define(
    'auth_providers',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Users,
                key: 'id',
            },
        },
        provider: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        providerId: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        familyName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        givenName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        photoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    }
);

// Associations
Users.hasMany(AuthProviders, { foreignKey: 'userId' });
AuthProviders.belongsTo(Users, { foreignKey: 'userId' });

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
        console.error('Error finding user:', err);
        throw err;
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
        console.error('Error finding user:', err);
        throw err;
    }
}
export async function validateUniqueFields(userData) {
    try {
        const existingUser = await Users.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { username: userData.username },
                    { email: userData.email },
                    { mobilePhone: userData.mobilePhone },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.username === userData.username) {
                throw new Error(
                    `The username '${userData.username}' is already in use.`
                );
            }
            if (existingUser.email === userData.email) {
                throw new Error(
                    `The email '${userData.email}' is already in use.`
                );
            }
            if (existingUser.mobilePhone === userData.mobilePhone) {
                throw new Error(
                    `The phone number '${userData.mobilePhone}' is already in use.`
                );
            }
        }
    } catch (err) {
        console.error('Error validating unique fields:', err);
        throw err;
    }
}

export async function createUser(userData) {
    try {
        const user = await Users.create({
            username: userData.username,
            email: userData.email,
            mobilePhone: userData.mobilePhone,
            password: userData.password,
        });
        return user;
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            // Collect all validation error messages
            const messages = err.errors.map((error) => error.message);
            throw new Error(messages.join(', '));
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            const field = err.errors[0].path;
            const value = err.errors[0].value;
            throw new Error(`The ${field} '${value}' is already in use.`);
        } else {
            console.error('Error creating user:', err);
            throw new Error('An unexpected error occurred.');
        }
    }
}

export async function createPendingUser(userData) {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await PendingSignups.create({
            username: userData.username,
            email: userData.email,
            mobilePhone: userData.mobilePhone,
            password: hashedPassword,
        });
        return user;
    } catch (err) {
        console.error(err);
        throw new Error(`pending user duplicate`);
    }
}

export async function findPendingUserById(id) {
    try {
        const user = await PendingSignups.findByPk(id);
        if (!user) {
            return null;
        }
        return user;
    } catch (err) {
        console.error('Error finding pending user:', err);
        throw err;
    }
}

export async function removePendingUser(pendingUser) {
    try {
        await PendingSignups.destroy({ where: { id: pendingUser.id } });
    } catch (err) {
        console.error('Error removing pending user:', err);
        throw err;
    }
}

export async function findUserByEmail(email) {
    try {
        const user = await Users.findOne({
            where: { email },
        });
        return user;
    } catch (err) {
        console.error('Error finding user by email:', err);
        throw err;
    }
}

export async function createAuthProvider(data) {
    AuthProviders.create({
        userId: data.userId,
        provider: data.provider,
        providerId: data.providerId,
        email: data.email,
        displayName: data.displayName,
        familyName: data.familyName,
        givenName: data.givenName,
        photoUrl: data.photoUrl,
    });
    console.log('Created new user from Google profile');
}
