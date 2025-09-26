import fs from 'fs';
import path from 'path';
import logger from '../lib/winston.js';

export async function up(queryInterface) {
    const filePath = path.resolve('data/phil-papers/en-records.json');
    const BATCH_SIZE = 100;
    const failedRecords = [];

    const raw = fs.readFileSync(filePath, 'utf-8');
    const records = JSON.parse(raw);

    let batch = [];
    let processedCount = 0;
    let successCount = 0;

    logger.info(`Processing ${records.length} records...`);

    // Add this function at the top with your other helpers
    function sanitizeString(str) {
        if (typeof str !== 'string') return str;

        // Remove control characters and ensure proper UTF-8 encoding
        return (
            str
                .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
                // Replace problematic characters with spaces
                .replace(/[\uD800-\uDFFF]/g, ' ')
        );
    }

    // Helper function to clean objects for JSONB
    function cleanForJSONB(obj) {
        if (!obj) return null;

        // Create a clean copy
        const clean = {};

        // Copy only serializable properties
        Object.keys(obj).forEach((key) => {
            // Skip properties starting with $ (commonly XML metadata)
            if (key.startsWith('$')) return;

            const value = obj[key];

            // Handle different value types
            if (value === undefined || value === null) {
                clean[key] = null;
            } else if (typeof value === 'string') {
                clean[key] = sanitizeString(value); // Sanitize string values
            } else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    clean[key] = value.map((item) =>
                        typeof item === 'string'
                            ? sanitizeString(item)
                            : typeof item === 'object' && item !== null
                              ? cleanForJSONB(item)
                              : item === undefined
                                ? null
                                : item
                    );
                } else {
                    clean[key] = cleanForJSONB(value);
                }
            } else if (typeof value !== 'function') {
                clean[key] = value;
            }
        });

        return clean;
    }

    async function testSimpleInsert() {
        // Create a very simple record with minimal data
        const testPost = {
            type: 'paper',
            title: 'Test Paper',
            identifier: 'test-123',
            author: 'Test Author',
            description: 'Test description',
            abstract: 'Test abstract',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            await queryInterface.bulkInsert('posts', [testPost], {
                validate: false,
            });
            logger.info('✅ Test insert succeeded!');
            // If this works, the issue is with your data, not the table structure
        } catch (error) {
            logger.error('❌ Test insert failed:', error.message);
            // If this fails, there might be a table structure issue
        }
    }

    //await testSimpleInsert();

    // Track existing identifiers to avoid duplicates
    const existingIdentifiers = new Set();

    // Query database for existing identifiers
    const existingRecords = await queryInterface.sequelize.query(
        "SELECT identifier FROM posts WHERE type = 'paper'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Add existing identifiers to the set
    existingRecords.forEach((record) => {
        if (record.identifier) {
            existingIdentifiers.add(record.identifier);
        }
    });

    logger.info(
        `Found ${existingIdentifiers.size} existing records. Will skip these.`
    );

    for (let i = 0; i < records.length; i++) {
        try {
            const rec = records[i];
            const identifier = rec.header?.identifier || `paper-${i}`;

            // Skip existing identifiers
            if (existingIdentifiers.has(identifier)) {
                logger.info(`Skipping existing record: ${identifier}`);
                continue;
            }

            let oaiDc = rec.metadata?.['oai_dc:dc'] || null;

            // Clean the JSONB fields
            const cleanOaiDc = cleanForJSONB(oaiDc);
            const cleanAbout = rec.about ? cleanForJSONB(rec.about) : null;

            // Prepare creator information for both dc_creator and author fields
            const creator = Array.isArray(oaiDc?.['dc:creator'])
                ? oaiDc['dc:creator'].join(', ')
                : oaiDc?.['dc:creator'] || 'Unknown Author';

            const post = {
                type: 'paper',
                title: sanitizeString(oaiDc?.['dc:title']) || 'Untitled',
                identifier: sanitizeString(identifier),
                author: sanitizeString(creator),
                datestamp: sanitizeString(rec.header?.datestamp),
                // Convert JSON objects to properly formatted strings for PostgreSQL
                oai_dc_dc: cleanOaiDc ? JSON.stringify(cleanOaiDc) : null,
                dc_title: sanitizeString(oaiDc?.['dc:title']) || null,
                dc_type: sanitizeString(oaiDc?.['dc:type']) || null,
                dc_creator: sanitizeString(creator),
                dc_subject: sanitizeString(oaiDc?.['dc:subject']) || null,
                dc_date: sanitizeString(oaiDc?.['dc:date']) || null,
                dc_identifier: sanitizeString(oaiDc?.['dc:identifier']) || null,
                dc_language: sanitizeString(oaiDc?.['dc:language']) || null,
                dc_description:
                    sanitizeString(oaiDc?.['dc:description']) || null,
                description: sanitizeString(oaiDc?.['dc:description']) || null,
                abstract: sanitizeString(oaiDc?.['dc:description']) || null,
                // Convert about object to properly formatted string
                about: cleanAbout ? JSON.stringify(cleanAbout) : null,
                rights: rec.about?.rights
                    ? sanitizeString(String(rec.about.rights))
                    : null,
                rightsReference: sanitizeString(
                    rec.about?.rights?.rightsReference?._ || null
                ),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            batch.push(post);
            processedCount++;

            if (batch.length === BATCH_SIZE || i === records.length - 1) {
                try {
                    await queryInterface.bulkInsert('posts', batch, {
                        validate: false,
                    });
                    successCount += batch.length;
                    logger.info(
                        `✅ Inserted ${batch.length} records. Total successful: ${successCount}/${processedCount}`
                    );
                } catch (batchError) {
                    console.error(
                        `❌ Batch insert failed:`,
                        batchError.message,
                        batchError.stack,
                        batchError.name,
                        batchError.parent?.code, // PostgreSQL error code
                        batchError.parent?.detail // PostgreSQL error detail
                    );

                    // Add this to detect VARCHAR limit issues:
                    if (
                        batchError.message.includes(
                            'value too long for type character varying'
                        )
                    ) {
                        console.error(
                            'Found VARCHAR length limit issue - will truncate values'
                        );

                        // Modify the batch to truncate all VARCHAR fields
                        batch = batch.map((post) => ({
                            ...post,
                            dc_creator: truncateForVarchar(
                                post.dc_creator,
                                250
                            ),
                            dc_subject: truncateForVarchar(
                                post.dc_subject,
                                250
                            ),
                            dc_type: truncateForVarchar(post.dc_type, 250),
                            dc_date: truncateForVarchar(post.dc_date, 250),
                            dc_language: truncateForVarchar(
                                post.dc_language,
                                250
                            ),
                            rights: truncateForVarchar(post.rights, 250),
                            rightsReference: truncateForVarchar(
                                post.rightsReference,
                                250
                            ),
                        }));

                        // Try again with truncated values
                        try {
                            await queryInterface.bulkInsert('posts', batch, {
                                validate: false,
                            });
                            successCount += batch.length;
                            console.log(
                                `✅ Inserted ${batch.length} records (after truncation). Total successful: ${successCount}/${processedCount}`
                            );
                            return; // Skip the individual inserts
                        } catch (truncatedBatchError) {
                            console.error(
                                'Batch insert still failed after truncation:',
                                truncatedBatchError.message
                            );
                        }
                    }

                    // Continue with individual inserts as before...
                    console.log('Attempting individual inserts...');
                    for (const singlePost of batch) {
                        try {
                            await queryInterface.bulkInsert(
                                'posts',
                                [singlePost],
                                { validate: false }
                            );
                            successCount++;
                        } catch (singleError) {
                            // Print detailed error information
                            console.error(
                                `Failed on record: ${singlePost.identifier}\n` +
                                    `Title: ${singlePost.title}\n` +
                                    `Error: ${singleError.message}\n` +
                                    `Error Name: ${singleError.name}\n` +
                                    `Error Code: ${singleError?.parent?.code}\n` +
                                    `Error Detail: ${singleError?.parent?.detail}\n` +
                                    `JSONB Data: ${JSON.stringify({
                                        oaiDc: typeof singlePost.oai_dc_dc,
                                        about: typeof singlePost.about,
                                    })}\n`
                            );

                            // Try to isolate which field is causing the issue
                            try {
                                const jsonTest = JSON.stringify(
                                    singlePost.oai_dc_dc
                                );
                                console.log('oai_dc_dc serializes OK');
                            } catch (e) {
                                console.log(
                                    'oai_dc_dc fails to serialize:',
                                    e.message
                                );
                            }

                            try {
                                const jsonTest = JSON.stringify(
                                    singlePost.about
                                );
                                console.log('about serializes OK');
                            } catch (e) {
                                console.log(
                                    'about fails to serialize:',
                                    e.message
                                );
                            }

                            // Collect failed record information
                            failedRecords.push({
                                post: singlePost,
                                error: singleError.message,
                            });
                            console.error(
                                `Failed on record: ${JSON.stringify(singlePost.identifier)}\n` +
                                    `Error: ${singleError.message}`
                            );
                        }
                    }
                }
                batch = [];
            }
        } catch (error) {
            console.error(`Error processing record ${i}:`, error.message);
            // Optionally collect failed records here as well
        }
    }

    // Write failed records to a file for later inspection or retry
    if (failedRecords.length > 0) {
        fs.writeFileSync(
            path.resolve('failed-records.json'),
            JSON.stringify(failedRecords, null, 2)
        );
        console.log(
            `❗ Wrote ${failedRecords.length} failed records to failed-records.json`
        );
    }

    console.log(
        `Seeding complete. Successfully inserted ${successCount}/${processedCount} records.`
    );
}

export async function down(queryInterface) {
    // Optionally, delete all seeded posts
    await queryInterface.bulkDelete('posts', { type: 'paper' }, {});
}
