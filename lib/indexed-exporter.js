import db from '../models/index.js';
import fs from 'fs';

async function exportTitlesAndDescriptions() {
    const posts = await db.posts.findAll({
        attributes: ['title', 'description'],
        where: { type: 'paper' },
    });
    fs.writeFileSync(
        'data/titles_descriptions.json',
        JSON.stringify(
            posts.map((p) => p.toJSON()),
            null,
            2
        )
    );
}

exportTitlesAndDescriptions();
