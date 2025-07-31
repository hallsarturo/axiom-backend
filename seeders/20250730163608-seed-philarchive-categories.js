import fs from 'fs';
import path from 'path';

async function insertCategories(
    categories,
    queryInterface,
    parentId = null,
    levels = []
) {
    for (const cat of categories) {
        if (!cat.name) continue;
        const entry = {
            name: cat.name,
            level0: levels[0] || (cat.level === 0 ? cat.name : null),
            level1: levels[1] || (cat.level === 1 ? cat.name : null),
            level2: levels[2] || (cat.level === 2 ? cat.name : null),
            level3: levels[3] || (cat.level === 3 ? cat.name : null),
            level4: levels[4] || (cat.level === 4 ? cat.name : null),
            parent_id: parentId,
        };

        // Insert the category and get its id
        const [inserted] = await queryInterface.bulkInsert(
            'philarchive_categories',
            [entry],
            { returning: true }
        );
        const thisId = inserted.id;

        // Recursively insert children with thisId as parent
        if (cat.children && cat.children.length > 0) {
            await insertCategories(cat.children, queryInterface, thisId, [
                ...levels,
                cat.name,
            ]);
        }
    }
}

export async function up(queryInterface) {
    const filePath = path.resolve(
        'data/categories/philarchive-categories-4.json'
    );
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    const hierarchical = json.categories || [];
    await insertCategories(hierarchical, queryInterface);
}

export async function down(queryInterface) {
    await queryInterface.bulkDelete('philarchive_categories', null, {});
}
