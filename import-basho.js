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

async function importBasho() {
    console.log('Starting basho import from sumo-api.com...');

    try {
        // Generate list of basho IDs from 2020 to 2025
        const bashoList = [];
        const currentYear = 2025;
        const startYear = 1800;

        for (let year = startYear; year <= currentYear; year++) {
            for (let month of ['01', '03', '05', '07', '09', '11']) {
                const bashoId = `${year}${month}`;
                if (parseInt(bashoId) <= 202509) {
                    bashoList.push(bashoId);
                }
            }
        }

        console.log(`Importing ${bashoList.length} basho...`);

        let totalImported = 0;
        let totalSkipped = 0;

        for (const bashoId of bashoList) {
            console.log(`\nFetching basho ${bashoId}...`);

            try {
                // Fetch basho data for Makuuchi division, day 1
                const url = `https://sumo-api.com/api/basho/${bashoId}/torikumi/Makuuchi/1`;
                const data = await httpsGet(url);

                if (!data) {
                    console.log(`  No data for basho ${bashoId}`);
                    totalSkipped++;
                    continue;
                }

                // Extract yusho winner for Makuuchi division
                let yushoWinnerId = null;
                let yushoWinnerName = null;

                if (data.yusho && Array.isArray(data.yusho)) {
                    const makuuchiYusho = data.yusho.find(y => y.type === 'Makuuchi');
                    if (makuuchiYusho) {
                        yushoWinnerId = makuuchiYusho.rikishiId;
                        yushoWinnerName = makuuchiYusho.shikonaEn;
                    }
                }

                // Insert basho record
                await pool.query(`
                    INSERT INTO basho (
                        basho_id, date, location, start_date, end_date,
                        division, yusho_winner_id, yusho_winner_name
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (basho_id) DO UPDATE SET
                        date = EXCLUDED.date,
                        location = EXCLUDED.location,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        yusho_winner_id = EXCLUDED.yusho_winner_id,
                        yusho_winner_name = EXCLUDED.yusho_winner_name
                `, [
                    bashoId,
                    data.date || bashoId,
                    data.location || 'Unknown',
                    data.startDate || null,
                    data.endDate || null,
                    'Makuuchi',
                    yushoWinnerId,
                    yushoWinnerName
                ]);

                console.log(`  Imported basho ${bashoId} - ${data.location || 'Unknown'}`);
                if (yushoWinnerName) {
                    console.log(`    Yusho winner: ${yushoWinnerName}`);
                }
                totalImported++;

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (bashoErr) {
                console.error(`  Error fetching basho ${bashoId}:`, bashoErr.message);
                totalSkipped++;
            }
        }

        console.log('\n=== Import Complete ===');
        console.log(`Total imported: ${totalImported}`);
        console.log(`Total skipped: ${totalSkipped}`);

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await pool.end();
    }
}

importBasho();
