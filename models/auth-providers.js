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

// Define authProviders
export default (sequelize, DataTypes) => {
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

    AuthProviders.associate = (db) => {
        AuthProviders.belongsTo(db.users, { foreignKey: 'userId' });
        // You can add more associations here if needed
    };

    // Static methods for DB interaction
    AuthProviders.createAuthProvider = async function (data) {
        const provider = await AuthProviders.create({
            userId: data.userId,
            provider: data.provider,
            providerId: data.providerId,
            email: data.email,
            displayName: data.displayName,
            familyName: data.familyName,
            givenName: data.givenName,
            photoUrl: data.photoUrl,
        });
        return provider;
    };

    AuthProviders.upsertAuthProvider = async function (providerData) {
        const [provider, created] = await AuthProviders.findOrCreate({
            where: {
                userId: providerData.userId,
                provider: providerData.provider,
            },
            defaults: providerData,
        });

        if (!created) {
            await provider.update(providerData);
        }
        return provider;
    };

    return AuthProviders;
};
