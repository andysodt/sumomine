const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

// PostgreSQL connection pool
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

// Fetch individual rikishi by ID
function fetchRikishiById(id) {
    return new Promise((resolve, reject) => {
        const url = `https://sumo-api.com/api/rikishi/${id}?measurements=true&ranks=true&intai=true`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 404 || res.statusCode === 204) {
                    resolve(null); // Not found or no content
                } else if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                } else {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Fetch data from sumo-api.com with pagination (to get total count)
function fetchRikishiPage(skip = 0) {
    return new Promise((resolve, reject) => {
        const url = `https://sumo-api.com/api/rikishis?limit=1000&skip=${skip}&measurements=true&ranks=true&intai=true`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Fetch all rikishi data by iterating through IDs
async function fetchAllRikishiData() {
    // First, get total count from the API
    console.log('Getting total rikishi count from API...');
    const initialResponse = await fetchRikishiPage(0);
    const totalReported = initialResponse.total || 9101;
    console.log(`API reports ${totalReported} total rikishi`);

    const allRikishis = [];
    let consecutiveNotFound = 0;
    const maxNotFound = 100; // Stop after 100 consecutive 404s

    // Start from ID 1 and iterate
    for (let id = 1; id <= totalReported + 1000; id++) {
        const rikishi = await fetchRikishiById(id);

        if (rikishi === null) {
            consecutiveNotFound++;
            if (consecutiveNotFound >= maxNotFound) {
                console.log(`\n  Stopping: ${maxNotFound} consecutive IDs not found`);
                break;
            }
        } else {
            consecutiveNotFound = 0; // Reset counter
            allRikishis.push(rikishi);

            if (allRikishis.length % 100 === 0) {
                console.log(`  Fetched ${allRikishis.length} rikishi (ID ${id})...`);
            }
        }

        // Rate limiting - 10 requests per second
        if (id % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n📊 Fetching complete: ${allRikishis.length} unique records fetched`);

    return {
        records: allRikishis,
        total: allRikishis.length
    };
}

// Import rikishi data into database
async function importRikishi() {
    const client = await pool.connect();

    try {
        console.log('Fetching rikishi data from sumo-api.com...');
        const apiResponse = await fetchAllRikishiData();
        const rikishis = apiResponse.records;

        console.log(`Found ${rikishis.length} rikishi records`);
        console.log(`Total available: ${apiResponse.total}`);

        let imported = 0;
        let skipped = 0;
        let measurementsImported = 0;
        let ranksImported = 0;

        // Process rikishi one by one
        for (const rikishi of rikishis) {
                    try {
                        // Parse birth date if available
                        let birthDate = null;
                        if (rikishi.birthDate) {
                            birthDate = new Date(rikishi.birthDate).toISOString().split('T')[0];
                        }

                        let rikishiId;

                        // Check if rikishi already exists by sumo_db_id or name
                        let existingRikishi;
                        if (rikishi.sumodbId) {
                            existingRikishi = await client.query(
                                'SELECT id FROM rikishis WHERE sumo_db_id = $1 LIMIT 1',
                                [rikishi.sumodbId]
                            );
                        } else {
                            existingRikishi = await client.query(
                                'SELECT id FROM rikishis WHERE shikona_en = $1 AND (debut = $2 OR debut IS NULL) LIMIT 1',
                                [rikishi.shikonaEn, rikishi.debut]
                            );
                        }

                        if (existingRikishi.rows.length > 0) {
                            // Update existing rikishi
                            rikishiId = existingRikishi.rows[0].id;
                            await client.query(`
                                UPDATE rikishis SET
                                    sumo_db_id = $1,
                                    nsk_id = $2,
                                    shikona_jp = $3,
                                    current_rank = $4,
                                    heya = $5,
                                    birth_date = $6,
                                    shusshin = $7,
                                    height = $8,
                                    weight = $9,
                                    debut = $10,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = $11
                            `, [
                                rikishi.sumodbId,
                                rikishi.nskId,
                                rikishi.shikonaJp,
                                rikishi.currentRank,
                                rikishi.heya,
                                birthDate,
                                rikishi.shusshin,
                                rikishi.height,
                                rikishi.weight,
                                rikishi.debut,
                                rikishiId
                            ]);
                        } else {
                            // Insert new rikishi
                            const result = await client.query(`
                                INSERT INTO rikishis (
                                    sumo_db_id, nsk_id, shikona_en, shikona_jp,
                                    current_rank, heya, birth_date, shusshin,
                                    height, weight, debut
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                RETURNING id
                            `, [
                                rikishi.sumodbId,
                                rikishi.nskId,
                                rikishi.shikonaEn,
                                rikishi.shikonaJp,
                                rikishi.currentRank,
                                rikishi.heya,
                                birthDate,
                                rikishi.shusshin,
                                rikishi.height,
                                rikishi.weight,
                                rikishi.debut
                            ]);
                            rikishiId = result.rows[0].id;
                        }

                        // Import rank history if available - batch insert
                        if (rikishi.rankHistory && rikishi.rankHistory.length > 0) {
                            // Delete old ranks for this rikishi
                            await client.query('DELETE FROM ranks WHERE rikishi_id = $1', [rikishiId]);

                            // Batch insert ranks
                            const rankValues = [];
                            const rankParams = [];
                            let paramIndex = 1;

                            for (const rankEntry of rikishi.rankHistory) {
                                rankValues.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
                                rankParams.push(rikishiId, rankEntry.bashoId, rankEntry.rankValue, rankEntry.rank);
                                paramIndex += 4;
                                ranksImported++;
                            }

                            if (rankValues.length > 0) {
                                await client.query(`
                                    INSERT INTO ranks (rikishi_id, basho_id, rank_value, rank)
                                    VALUES ${rankValues.join(', ')}
                                `, rankParams);
                            }
                        }

                        // Import measurement history if available - batch insert
                        if (rikishi.measurementHistory && rikishi.measurementHistory.length > 0) {
                            // Delete old measurements for this rikishi
                            await client.query('DELETE FROM measurements WHERE rikishi_id = $1', [rikishiId]);

                            // Batch insert measurements
                            const measurementValues = [];
                            const measurementParams = [];
                            let paramIndex = 1;

                            for (const measurement of rikishi.measurementHistory) {
                                measurementValues.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
                                measurementParams.push(rikishiId, measurement.bashoId, measurement.height, measurement.weight);
                                paramIndex += 4;
                                measurementsImported++;
                            }

                            if (measurementValues.length > 0) {
                                await client.query(`
                                    INSERT INTO measurements (rikishi_id, basho_id, height, weight)
                                    VALUES ${measurementValues.join(', ')}
                                `, measurementParams);
                            }
                        }

                imported++;

                if (imported % 100 === 0) {
                    console.log(`Imported ${imported} rikishi...`);
                }
            } catch (error) {
                console.error(`Error importing ${rikishi.shikonaEn}:`, error.message);
                skipped++;
            }
        }

        console.log('\n=== Import Complete ===');
        console.log(`Successfully imported: ${imported}`);
        console.log(`Ranks imported: ${ranksImported}`);
        console.log(`Measurements imported: ${measurementsImported}`);
        console.log(`Skipped: ${skipped}`);

        // Display some statistics
        const statsResult = await client.query(`
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT heya) as total_heya,
                COUNT(DISTINCT current_rank) as total_ranks
            FROM rikishis
        `);

        console.log('\n=== Database Statistics ===');
        console.log(`Total rikishis: ${statsResult.rows[0].total}`);
        console.log(`Total heya (stables): ${statsResult.rows[0].total_heya}`);
        console.log(`Total ranks: ${statsResult.rows[0].total_ranks}`);

        // Display top 10 rikishis by current rank
        const topRikishis = await client.query(`
            SELECT shikona_en, current_rank, heya, height, weight
            FROM rikishis
            WHERE current_rank IS NOT NULL
            ORDER BY id
            LIMIT 10
        `);

        console.log('\n=== Sample Rikishis ===');
        topRikishis.rows.forEach(w => {
            console.log(`${w.shikona_en} - ${w.current_rank} (${w.heya})`);
        });

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run import
importRikishi().catch(console.error);
