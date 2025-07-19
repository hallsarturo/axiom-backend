import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/config.js';
import bcrypt from 'bcrypt';

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

// Define PendingSignups
export default (sequelize, DataTypes) => {
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

    // Static methods for DB interaction
    PendingSignups.createPendingUser = async function (userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        return PendingSignups.create({
            username: userData.username,
            email: userData.email,
            mobilePhone: userData.mobilePhone,
            password: hashedPassword,
        });
    };

    PendingSignups.findPendingUserById = async function (id) {
        return PendingSignups.findByPk(id);
    };

    PendingSignups.removePendingUser = async function (pendingUser) {
        await PendingSignups.destroy({ where: { id: pendingUser.id } });
    };

    return PendingSignups;
};
