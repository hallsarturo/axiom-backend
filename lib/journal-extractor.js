import fs from 'node:fs';
import path from 'path';
import logger from '../../lib/winston.js';

const _dir_path = 'data/phil-papers/short.json';

let fileContent;
let data;

try {
    fs.accessSync(_dir_path, fs.constants.F_OK);
    fileContent = fs.readFileSync(_dir_path, 'utf-8');
    data = JSON.parse(fileContent);
} catch (err) {
    logger.error('File does not exist or is not accessible');
}

const posts = [];

data.map((post) => {
    const dc = post.metadata['oai_dc:dc'];
    posts.push({
        title: dc['dc:title'],
        creator: dc['dc:creator'],
        datestamp: post.header.datestamp,
        subject: dc['dc:subject'],
        description: dc['dc:description'],
        identifier: dc['dc:identifier'],
    });
});

// Function to write posts array to a new JSON file
function writePostsToFile(outputPath) {
    try {
        fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf-8');
        logger.log(`Posts written to ${outputPath}`);
    } catch (err) {
        logger.error('Error writing posts to file:', err);
    }
}

// Example usage:
writePostsToFile('data/phil-papers/posts.json');
