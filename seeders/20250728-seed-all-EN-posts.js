import fs from 'fs';
import path from 'path';

export async function up(queryInterface) {
    const filePath = path.resolve('data/phil-papers/en-records.json');
    const BATCH_SIZE = 100; // Reduced batch size

    // Read and parse the file in memory
    const raw = fs.readFileSync(filePath, 'utf-8');
    const records = JSON.parse(raw);

    let batch = [];
    let processedCount = 0;
    let successCount = 0;

    console.log(`Processing ${records.length} records...`);

    for (let i = 0; i < records.length; i++) {
        try {
            const rec = records[i];
            let oaiDc = rec.metadata?.['oai_dc:dc'] || null;

            // Deep clean the object - handle properly for Postgres JSONB
            if (oaiDc) {
                if (oaiDc.$) delete oaiDc.$; // Remove XML attributes
            }

            // Prepare the post object with explicit string conversions for JSONB fields
            const post = {
                type: 'paper',
                title: oaiDc?.['dc:title'] || 'Untitled',
                identifier: rec.header?.identifier,
                datestamp: rec.header?.datestamp,
                // Store JSONB as stringified JSON - let Postgres handle the conversion
                oai_dc_dc: oaiDc ? JSON.stringify(oaiDc) : null,
                dc_title: oaiDc?.['dc:title'] || null,
                dc_type: oaiDc?.['dc:type'] || null,
                dc_creator: Array.isArray(oaiDc?.['dc:creator'])
                    ? oaiDc['dc:creator'].join(', ')
                    : oaiDc?.['dc:creator'] || null,
                dc_subject: oaiDc?.['dc:subject'] || null,
                dc_date: oaiDc?.['dc:date'] || null,
                dc_identifier: oaiDc?.['dc:identifier'] || null,
                dc_language: oaiDc?.['dc:language'] || null,
                dc_description: oaiDc?.['dc:description'] || null,
                // Also stringify the about field
                about: rec.about ? JSON.stringify(rec.about) : null,
                rights: rec.about?.rights ? String(rec.about.rights) : null,
                rightsReference: rec.about?.rights?.rightsReference?._ || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            batch.push(post);
            processedCount++;

            // Insert in batches
            if (batch.length === BATCH_SIZE || i === records.length - 1) {
                try {
                    await queryInterface.bulkInsert('posts', batch);
                    successCount += batch.length;
                    console.log(
                        `✅ Inserted ${batch.length} records. Total successful: ${successCount}/${processedCount}`
                    );
                } catch (batchError) {
                    console.error(
                        `❌ Batch insert failed:`,
                        batchError.message
                    );

                    // Try inserting records one by one
                    console.log('Attempting individual inserts...');
                    for (const singlePost of batch) {
                        try {
                            await queryInterface.bulkInsert('posts', [
                                singlePost,
                            ]);
                            successCount++;
                        } catch (singleError) {
                            console.error(
                                `Failed on record:`,
                                JSON.stringify(singlePost.identifier)
                            );
                        }
                    }
                }
                batch = [];
            }
        } catch (error) {
            console.error(`Error processing record ${i}:`, error.message);
            // Continue with next record
        }
    }

    console.log(
        `Seeding complete. Successfully inserted ${successCount}/${processedCount} records.`
    );
}

export async function down(queryInterface) {
    // Optionally, delete all seeded posts
    await queryInterface.bulkDelete('posts', { type: 'paper' }, {});
}
