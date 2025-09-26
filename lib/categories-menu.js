import fs from 'fs';
import path from 'path';
import db from '../models/index.js';
import logger from './winston.js';

async function exportCategories() {
    // Fetch level0 categories
    const level0 = await db.philarchive_categories.findAll({
        where: {
            level0: { [db.Sequelize.Op.ne]: null },
            level1: null,
            level2: null,
            level3: null,
            level4: null,
        },
        attributes: ['id', 'name'],
        raw: true,
    });

    // Fetch level1 categories
    const level1 = await db.philarchive_categories.findAll({
        where: {
            level1: { [db.Sequelize.Op.ne]: null },
            level2: null,
            level3: null,
            level4: null,
        },
        attributes: ['id', 'name', 'parent_id'],
        raw: true,
    });

    // Format level0 categories (parentId = null)
    const level0Formatted = level0.map((cat) => ({
        id: cat.id,
        name: cat.name,
        parentId: null,
    }));

    // Format level1 categories
    const level1Formatted = level1.map((cat) => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parent_id,
    }));

    // Ensure directory exists
    const dirPath = path.join(process.cwd(), 'data', 'categories');
    fs.mkdirSync(dirPath, { recursive: true });

    // Write to JSON file
    const output = {
        level0: level0Formatted,
        level1: level1Formatted,
    };

    const filePath = path.join(dirPath, 'menu-categories.json');
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    // logger.info(`menu-categories.json written to ${filePath}`);
}

exportCategories();
