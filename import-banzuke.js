const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sumomine',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 1800000, // 30 minutes
    statement_timeout: 1800000, // 30 minutes
    query_timeout: 1800000, // 30 minutes
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

async function importBanzuke() {
    console.log('Starting banzuke import...');

    // Get all basho from database
    const bashoResult = await pool.query('SELECT basho_id FROM basho ORDER BY basho_id DESC');
    const bashoList = bashoResult.rows.map(row => row.basho_id);

    console.log(`Found ${bashoList.length} basho to import banzuke for`);

    const divisions = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'];

    for (const bashoId of bashoList) {
        console.log(`\nProcessing basho ${bashoId}...`);

        for (const division of divisions) {
            try {
                const url = `https://sumo-api.com/api/basho/${bashoId}/banzuke/${division}`;
                console.log(`  Fetching ${division}...`);
                const data = await httpsGet(url);

                if (!data || !data.east || !data.west) {
                    console.log(`  No data for ${division}`);
                    continue;
                }

                // Process East side
                for (const rikishi of data.east) {
                    // Try to find matching rikishi in database
                    const rikishiMatch = await pool.query(
                        'SELECT id FROM rikishis WHERE shikona_en = $1 LIMIT 1',
                        [rikishi.shikonaEn]
                    );

                    const rikishiId = rikishiMatch.rows.length > 0 ? rikishiMatch.rows[0].id : null;

                    await pool.query(`
                        INSERT INTO banzuke (
                            basho_id, rikishi_id, sumo_db_id, shikona_en, shikona_jp,
                            rank, rank_value, division, heya
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (basho_id, sumo_db_id) DO UPDATE SET
                            rikishi_id = EXCLUDED.rikishi_id,
                            shikona_en = EXCLUDED.shikona_en,
                            shikona_jp = EXCLUDED.shikona_jp,
                            rank = EXCLUDED.rank,
                            rank_value = EXCLUDED.rank_value,
                            division = EXCLUDED.division,
                            heya = EXCLUDED.heya
                    `, [
                        bashoId,
                        rikishiId,
                        rikishi.rikishiID,
                        rikishi.shikonaEn,
                        rikishi.shikonaJp || '',
                        rikishi.rank,
                        rikishi.rankValue,
                        division,
                        rikishi.heya || ''
                    ]);
                }

                // Process West side
                for (const rikishi of data.west) {
                    // Try to find matching rikishi in database
                    const rikishiMatch = await pool.query(
                        'SELECT id FROM rikishis WHERE shikona_en = $1 LIMIT 1',
                        [rikishi.shikonaEn]
                    );

                    const rikishiId = rikishiMatch.rows.length > 0 ? rikishiMatch.rows[0].id : null;

                    await pool.query(`
                        INSERT INTO banzuke (
                            basho_id, rikishi_id, sumo_db_id, shikona_en, shikona_jp,
                            rank, rank_value, division, heya
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (basho_id, sumo_db_id) DO UPDATE SET
                            rikishi_id = EXCLUDED.rikishi_id,
                            shikona_en = EXCLUDED.shikona_en,
                            shikona_jp = EXCLUDED.shikona_jp,
                            rank = EXCLUDED.rank,
                            rank_value = EXCLUDED.rank_value,
                            division = EXCLUDED.division,
                            heya = EXCLUDED.heya
                    `, [
                        bashoId,
                        rikishiId,
                        rikishi.rikishiID,
                        rikishi.shikonaEn,
                        rikishi.shikonaJp || '',
                        rikishi.rank,
                        rikishi.rankValue,
                        division,
                        rikishi.heya || ''
                    ]);
                }

                console.log(`  ✓ Imported ${division}`);

            } catch (err) {
                console.error(`  ✗ Error importing ${division} for ${bashoId}:`, err.message);
            }

            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    console.log('\nBanzuke import completed!');
    pool.end();
}

importBanzuke().catch(err => {
    console.error('Fatal error:', err);
    pool.end();
    process.exit(1);
});
