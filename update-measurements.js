const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sumomine',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function updateMeasurements() {
    console.log('Starting measurements update...');

    try {
        // Get all rikishi from our database with their sumo_db_id
        const rikishiResult = await pool.query(
            'SELECT id, sumo_db_id, shikona_en FROM rikishis WHERE sumo_db_id IS NOT NULL ORDER BY id'
        );

        console.log(`Found ${rikishiResult.rows.length} rikishi to update`);

        let updated = 0;
        let errors = 0;

        for (const rikishi of rikishiResult.rows) {
            try {
                // Fetch rikishi details from API
                const url = `https://sumo-api.com/api/rikishi/${rikishi.sumo_db_id}`;
                const data = await httpsGet(url);

                if (data && (data.height || data.weight)) {
                    // Update height and weight in database
                    await pool.query(
                        'UPDATE rikishis SET height = $1, weight = $2 WHERE id = $3',
                        [data.height || null, data.weight || null, rikishi.id]
                    );

                    console.log(`✓ Updated ${rikishi.shikona_en}: ${data.height}cm, ${data.weight}kg`);
                    updated++;
                } else {
                    console.log(`- No measurement data for ${rikishi.shikona_en}`);
                }

                // Delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (err) {
                console.error(`✗ Error updating ${rikishi.shikona_en}:`, err.message);
                errors++;
            }
        }

        console.log(`\nMeasurements update completed!`);
        console.log(`Updated: ${updated}`);
        console.log(`Errors: ${errors}`);

    } catch (err) {
        console.error('Fatal error:', err);
    }

    pool.end();
}

updateMeasurements();
