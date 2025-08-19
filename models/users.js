import dotenv from 'dotenv';
dotenv.config();

import parsePhoneNumber from 'libphonenumber-js';
import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
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
                allowNull: true,
                unique: {
                    msg: 'This phone number is already in use',
                },
                validate: {
                    async isValidPhone(value) {
                        if (!value) return; // <-- skip validation if value is null/undefined
                        const phone = parsePhoneNumber(value);
                        if (!phone?.isValid()) {
                            throw new Error('Invalid phone number');
                        }
                    },
                },
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            isVerified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            about: {
                type: DataTypes.TEXT,
                allowNull: true,
                // Optionally, add a comment for documentation
                comment: 'User description/about field',
            },
            userProfilePic: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Relative path to user profile picture',
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Date when the user account was created',
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Date when the user account was last updated',
            },
        },
        {
            timestamps: true,
        }
    );

    Users.associate = (db) => {
        if (db.AuthProviders) {
            Users.hasMany(db.AuthProviders, { foreignKey: 'userId' });
            db.AuthProviders.belongsTo(Users, { foreignKey: 'userId' });
        }
    };

    // Static/instance methods for DB interaction
    Users.findUserByUsername = async function (userData) {
        try {
            const user = await Users.findOne({
                where: { username: userData.username },
            });
            if (!user) {
                return 0;
            }
            const match = await bcrypt.compare(
                userData.password,
                user.password
            );
            if (!match) {
                return 2;
            } else {
                return user;
            }
        } catch (err) {
            console.error('Error finding user:', err);
            throw err;
        }
    };

    Users.findUserById = async function (userData) {
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
    };

    Users.validateUniqueFields = async function (userData) {
        try {
            const { Op } = sequelize.Sequelize;
            const existingUser = await Users.findOne({
                where: {
                    [Op.or]: [
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
    };

    Users.createUser = async function (userData) {
        try {
            const user = await Users.create({
                username: userData.username,
                email: userData.email,
                mobilePhone: userData.mobilePhone,
                password: userData.password,
                isVerified: false,
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
    };

    Users.setVerified = async function (userId) {
        try {
            const user = await Users.findByPk(userId);
            if (!user) return null;
            user.isVerified = true;
            await user.save();
            return user;
        } catch (err) {
            console.error('Error updating user verification:', err);
            throw err;
        }
    };

    Users.findUserByEmail = async function (email) {
        try {
            const user = await Users.findOne({
                where: { email },
            });
            if (!user) {
                return null;
            }
            return user;
        } catch (err) {
            console.error('Error finding user by email:', err);
            throw err;
        }
    };

    return Users;
};
