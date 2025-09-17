import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import db from '../models/index.js';

// Path to your CSV file
const csvFilePath = path.join(
    process.cwd(),
    'data',
    'categories',
    'philarchive_categories_table.csv'
);

const categories = new Map();

fs.createReadStream(csvFilePath)
    .pipe(csv({ headers: false }))
    .on('data', (row) => {
        // row[0] = id, row[6] = name
        const id = parseInt(row[0], 10);
        const name = row[6]?.trim();
        if (id && name && !categories.has(id)) {
            categories.set(id, { id, name });
        }
    })
    .on('end', async () => {
        try {
            const categoryArray = Array.from(categories.values());
            await db.categories.bulkCreate(categoryArray, {
                ignoreDuplicates: true,
            });
            console.log(`Inserted ${categoryArray.length} categories.`);
        } catch (err) {
            logger.error('Bulk insert error:', err);
        }
    });
