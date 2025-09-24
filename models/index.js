import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import process from 'process';
import config from '../config/config.js';

const db = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = 'production';
const dbConfig = config[env];

if (!dbConfig) {
    throw new Error(`Database config for environment "${env}" not found.`);
}

// Use dbConfig.use_env_variable only if it exists
let sequelize;
if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        dbConfig
    );
}

const files = fs.readdirSync(__dirname).filter((file) => {
    return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
    );
});

for (const file of files) {
    const model = await import(path.join(__dirname, file)).then((module) =>
        module.default(sequelize, Sequelize.DataTypes)
    );
    db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
