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

async function importBouts() {
    console.log('Starting bouts import from sumo-api.com...');

    try {
        // Get list of recent basho (tournaments)
        // Basho format: YYYYMM where MM is 01, 03, 05, 07, 09, or 11
        const bashoList = [];
        const currentYear = 2025;
        const startYear = 2023; // Import last 2-3 years

        for (let year = startYear; year <= currentYear; year++) {
            for (let month of ['01', '03', '05', '07', '09', '11']) {
                const bashoId = `${year}${month}`;
                // Only add basho up to current date (Sept 2025)
                if (parseInt(bashoId) <= 202509) {
                    bashoList.push(bashoId);
                }
            }
        }

        console.log(`Importing bouts from ${bashoList.length} basho...`);

        let totalBouts = 0;
        let totalInserted = 0;
        let totalSkipped = 0;

        for (const bashoId of bashoList) {
            console.log(`\nFetching basho ${bashoId}...`);

            try {
                const division = 'Makuuchi';
                const bashoTotalBouts = [];

                // Fetch all 15 days of the tournament
                for (let day = 1; day <= 15; day++) {
                    try {
                        const url = `https://sumo-api.com/api/basho/${bashoId}/torikumi/${division}/${day}`;
                        const dayData = await httpsGet(url);

                        if (dayData && dayData.torikumi && Array.isArray(dayData.torikumi)) {
                            bashoTotalBouts.push(...dayData.torikumi);
                        }

                        // Rate limiting - wait 200ms between day requests
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (dayErr) {
                        // Skip missing days
                        continue;
                    }
                }

                if (bashoTotalBouts.length === 0) {
                    console.log(`  No data for basho ${bashoId}`);
                    continue;
                }

                console.log(`  Found ${bashoTotalBouts.length} bouts`);
                totalBouts += bashoTotalBouts.length;

                // Insert each bout
                for (const bout of bashoTotalBouts) {
                    try {
                        const result = await pool.query(`
                            INSERT INTO bouts (
                                basho_id, division, day, match_no,
                                east_id, east_shikona, east_rank,
                                west_id, west_shikona, west_rank,
                                kimarite, winner_id, winner_en, winner_jp
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                            ON CONFLICT (basho_id, division, day, match_no) DO NOTHING
                            RETURNING id
                        `, [
                            bout.bashoId,
                            bout.division,
                            bout.day,
                            bout.matchNo,
                            bout.eastId,
                            bout.eastShikona,
                            bout.eastRank,
                            bout.westId,
                            bout.westShikona,
                            bout.westRank,
                            bout.kimarite,
                            bout.winnerId,
                            bout.winnerEn,
                            bout.winnerJp
                        ]);

                        if (result.rowCount > 0) {
                            totalInserted++;
                        } else {
                            totalSkipped++;
                        }
                    } catch (insertErr) {
                        if (insertErr.code === '23505') { // Unique constraint violation
                            totalSkipped++;
                        } else {
                            console.error(`  Error inserting bout:`, insertErr.message);
                        }
                    }
                }

                console.log(`  Inserted: ${bashoTotalBouts.length} bouts for ${bashoId}`);

            } catch (bashoErr) {
                console.error(`  Error fetching basho ${bashoId}:`, bashoErr.message);
            }
        }

        console.log('\n=== Import Complete ===');
        console.log(`Total bouts processed: ${totalBouts}`);
        console.log(`Total inserted: ${totalInserted}`);
        console.log(`Total skipped (duplicates): ${totalSkipped}`);

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await pool.end();
    }
}

importBouts();
