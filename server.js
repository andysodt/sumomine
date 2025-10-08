const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sumomine',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Middleware
app.use(express.json());

// Serve static assets from dist folder (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static assets (images, etc) from root
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/logo.svg', express.static(path.join(__dirname, 'logo.svg')));
app.use('/favicon.svg', express.static(path.join(__dirname, 'favicon.svg')));

// API Routes

// Get rikishi statistics (must be before /:id route)
app.get('/api/rikishis/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) as total_rikishis,
                COUNT(DISTINCT heya) as total_heya,
                COUNT(DISTINCT current_rank) as total_ranks,
                AVG(height)::numeric as avg_height,
                AVG(weight)::numeric as avg_weight,
                (SELECT COUNT(*) FROM bouts) as total_matches
            FROM rikishis
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get top performers (must be before /:id route)
app.get('/api/rikishis/top-performers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM rikishis
            WHERE wins + losses > 0
            ORDER BY (wins::float / NULLIF(wins + losses, 0)) DESC, wins DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch top performers' });
    }
});

// Get all rikishis with filtering and search
app.get('/api/rikishis', async (req, res) => {
    try {
        const { search, heya, rank, division, limit = 50, offset = 0 } = req.query;

        // Build WHERE conditions
        let whereConditions = [];
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(shikona_en ILIKE $${paramIndex} OR shikona_jp ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (heya) {
            whereConditions.push(`heya = $${paramIndex}`);
            params.push(heya);
            paramIndex++;
        }

        if (division) {
            // Map division to rank patterns
            const divisionRanks = {
                'Makuuchi': ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi', 'Maegashira'],
                'Juryo': ['Juryo'],
                'Makushita': ['Makushita'],
                'Sandanme': ['Sandanme'],
                'Jonidan': ['Jonidan'],
                'Jonokuchi': ['Jonokuchi']
            };

            const ranks = divisionRanks[division];
            if (ranks) {
                const rankConditions = ranks.map(() => `current_rank ILIKE $${paramIndex++}`).join(' OR ');
                whereConditions.push(`(${rankConditions})`);
                ranks.forEach(r => params.push(`${r}%`));
            }
        }

        if (rank) {
            whereConditions.push(`current_rank ILIKE $${paramIndex}`);
            params.push(`%${rank}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM rikishis ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with dynamic wins/losses calculation
        let query = `
            SELECT
                r.*,
                COALESCE(wins.win_count, 0) as wins,
                COALESCE(losses.loss_count, 0) as losses
            FROM rikishis r
            LEFT JOIN (
                SELECT east_shikona as shikona, COUNT(*) as win_count
                FROM bouts
                WHERE winner_en = east_shikona
                GROUP BY east_shikona
                UNION ALL
                SELECT west_shikona as shikona, COUNT(*) as win_count
                FROM bouts
                WHERE winner_en = west_shikona
                GROUP BY west_shikona
            ) wins ON r.shikona_en = wins.shikona
            LEFT JOIN (
                SELECT east_shikona as shikona, COUNT(*) as loss_count
                FROM bouts
                WHERE winner_en IS NOT NULL AND winner_en != east_shikona
                GROUP BY east_shikona
                UNION ALL
                SELECT west_shikona as shikona, COUNT(*) as loss_count
                FROM bouts
                WHERE winner_en IS NOT NULL AND winner_en != west_shikona
                GROUP BY west_shikona
            ) losses ON r.shikona_en = losses.shikona
            ${whereClause}
            GROUP BY r.id, wins.win_count, losses.loss_count
            ORDER BY r.id
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const queryParams = [...params, limit, offset];

        const result = await pool.query(query, queryParams);

        res.json({
            data: result.rows,
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch rikishis' });
    }
});

// Get single rikishi (must be after specific routes)
app.get('/api/rikishis/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM rikishis WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rikishi not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch rikishi' });
    }
});

// Get rank history for a rikishi
app.get('/api/rikishis/:id/ranks', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM ranks WHERE rikishi_id = $1 ORDER BY basho_id ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
});

// Get measurements for a rikishi
app.get('/api/rikishis/:id/measurements', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM measurements WHERE rikishi_id = $1 ORDER BY basho_id DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch measurements' });
    }
});

// Get rank history for a rikishi
app.get('/api/rikishis/:id/ranks', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM ranks WHERE rikishi_id = $1 ORDER BY basho_id DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
});

// Get shikona history for a rikishi
app.get('/api/rikishis/:id/shikona', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM shikona WHERE rikishi_id = $1 ORDER BY date_start DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch shikona' });
    }
});

// Get bouts for a rikishi (by shikona name)
app.get('/api/rikishis/:id/bouts', async (req, res) => {
    try {
        const { id } = req.params;

        // First get the shikona_en for this rikishi
        const rikishiResult = await pool.query('SELECT shikona_en FROM rikishis WHERE id = $1', [id]);
        if (rikishiResult.rows.length === 0) {
            return res.status(404).json({ error: 'Rikishi not found' });
        }

        const shikonaEn = rikishiResult.rows[0].shikona_en;

        // Get bouts where this rikishi was either east or west (match by name)
        const result = await pool.query(
            `SELECT * FROM bouts
             WHERE east_shikona = $1 OR west_shikona = $1
             ORDER BY basho_id DESC, day DESC, match_no DESC`,
            [shikonaEn]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bouts' });
    }
});

// Get recent matches
app.get('/api/matches/recent', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                basho_id,
                day,
                east_shikona as rikishi_name,
                west_shikona as opponent,
                CASE
                    WHEN winner_en = east_shikona THEN 'win'
                    WHEN winner_en = west_shikona THEN 'loss'
                    ELSE 'no result'
                END as result,
                kimarite
            FROM bouts
            WHERE winner_en IS NOT NULL
            ORDER BY basho_id DESC, day DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recent matches' });
    }
});

// Get all heya (stables)
app.get('/api/heya', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT heya, COUNT(*) as rikishi_count
            FROM rikishis
            WHERE heya IS NOT NULL
            GROUP BY heya
            ORDER BY rikishi_count DESC, heya
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch heya' });
    }
});

// Get all bouts (for head-to-head calculations) - must be before /api/basho/:bashoId/bouts
app.get('/api/bouts/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bouts WHERE winner_en IS NOT NULL ORDER BY basho_id DESC, day DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch all bouts' });
    }
});

// Get all basho
app.get('/api/basho', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM basho
            ORDER BY basho_id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch basho' });
    }
});

// Get single basho
app.get('/api/basho/:bashoId', async (req, res) => {
    try {
        const { bashoId } = req.params;
        const result = await pool.query('SELECT * FROM basho WHERE basho_id = $1', [bashoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Basho not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch basho' });
    }
});

// Get bouts for a basho
app.get('/api/basho/:bashoId/bouts', async (req, res) => {
    try {
        const { bashoId } = req.params;
        const result = await pool.query(
            'SELECT * FROM bouts WHERE basho_id = $1 ORDER BY day, match_no',
            [bashoId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch basho bouts' });
    }
});

// Get head-to-head record between two rikishi
app.get('/api/head-to-head/:rikishi1/:rikishi2', async (req, res) => {
    try {
        const { rikishi1, rikishi2 } = req.params;
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE winner_en = $1) as rikishi1_wins,
                COUNT(*) FILTER (WHERE winner_en = $2) as rikishi2_wins
            FROM bouts
            WHERE ((east_shikona = $1 AND west_shikona = $2)
                OR (east_shikona = $2 AND west_shikona = $1))
            AND winner_en IS NOT NULL
        `, [rikishi1, rikishi2]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch head-to-head record' });
    }
});

// Get banzuke for a basho
app.get('/api/banzuke/:bashoId', async (req, res) => {
    try {
        const { bashoId } = req.params;
        const result = await pool.query(
            `SELECT
                b.*,
                r.shusshin as birthplace,
                COALESCE(
                    (SELECT COUNT(*)
                     FROM bouts
                     WHERE basho_id = $1
                     AND winner_en IS NOT NULL
                     AND (
                         (east_shikona = b.shikona_en AND winner_en = b.shikona_en)
                         OR (west_shikona = b.shikona_en AND winner_en = b.shikona_en)
                     )
                    ), 0
                ) as wins,
                COALESCE(
                    (SELECT COUNT(*)
                     FROM bouts
                     WHERE basho_id = $1
                     AND winner_en IS NOT NULL
                     AND (
                         (east_shikona = b.shikona_en AND winner_en != b.shikona_en)
                         OR (west_shikona = b.shikona_en AND winner_en != b.shikona_en)
                     )
                    ), 0
                ) as losses
             FROM banzuke b
             LEFT JOIN rikishis r ON b.shikona_en = r.shikona_en
             WHERE b.basho_id = $1
             ORDER BY b.rank_value`,
            [bashoId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch banzuke' });
    }
});

// Add new rikishi
app.post('/api/rikishis', async (req, res) => {
    const { name, rank } = req.body;

    if (!name || !rank) {
        return res.status(400).json({ error: 'Name and rank are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO rikishis (shikona_en, current_rank) VALUES ($1, $2) RETURNING *',
            [name, rank]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create rikishi' });
    }
});

// Delete rikishi
app.delete('/api/rikishis/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM rikishis WHERE id = $1', [id]);
        res.json({ message: 'Rikishi deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete rikishi' });
    }
});

// Get all matches
app.get('/api/matches', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM matches ORDER BY match_date DESC, created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Add new match
app.post('/api/matches', async (req, res) => {
    const { rikishi_id, rikishi_name, result, opponent, match_date } = req.body;

    if (!rikishi_id || !result || !opponent || !match_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert match
        const matchResult = await client.query(
            'INSERT INTO matches (rikishi_id, rikishi_name, result, opponent, match_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [rikishi_id, rikishi_name, result, opponent, match_date]
        );

        // Update rikishi stats
        const updateField = result === 'win' ? 'wins' : 'losses';
        await client.query(
            `UPDATE rikishis SET ${updateField} = ${updateField} + 1 WHERE id = $1`,
            [rikishi_id]
        );

        await client.query('COMMIT');
        res.status(201).json(matchResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create match' });
    } finally {
        client.release();
    }
});

// Delete match
app.delete('/api/matches/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get match details before deleting
        const matchResult = await client.query(
            'SELECT rikishi_id, result FROM matches WHERE id = $1',
            [id]
        );

        if (matchResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Match not found' });
        }

        const match = matchResult.rows[0];

        // Delete match
        await client.query('DELETE FROM matches WHERE id = $1', [id]);

        // Update rikishi stats
        const updateField = match.result === 'win' ? 'wins' : 'losses';
        await client.query(
            `UPDATE rikishis SET ${updateField} = ${updateField} - 1 WHERE id = $1 AND ${updateField} > 0`,
            [match.rikishi_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Match deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete match' });
    } finally {
        client.release();
    }
});

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imagePath = `/images/${req.file.filename}`;
        const rikishiId = req.body.rikishiId;

        // If rikishi ID is provided, update the database
        if (rikishiId) {
            await pool.query(
                'UPDATE rikishis SET image_url = $1 WHERE id = $2',
                [imagePath, rikishiId]
            );
        }

        res.json({
            success: true,
            filename: req.file.filename,
            path: imagePath,
            rikishiId: rikishiId || null
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Import rikishi from sumo-api.com
app.post('/api/rikishis/import', async (req, res) => {
    const https = require('https');
    const client = await pool.connect();

    try {
        // Set response headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendProgress = (message) => {
            res.write(`data: ${JSON.stringify({ message })}\n\n`);
        };

        // Fetch individual rikishi by ID
        const fetchRikishiById = (id) => {
            return new Promise((resolve, reject) => {
                const url = `https://sumo-api.com/api/rikishi/${id}?measurements=true&ranks=true&shikona=true&intai=true`;
                https.get(url, (apiRes) => {
                    let data = '';
                    apiRes.on('data', (chunk) => { data += chunk; });
                    apiRes.on('end', () => {
                        if (apiRes.statusCode === 404 || apiRes.statusCode === 204) {
                            resolve(null);
                        } else if (apiRes.statusCode !== 200) {
                            reject(new Error(`HTTP ${apiRes.statusCode}`));
                        } else {
                            try {
                                resolve(JSON.parse(data));
                            } catch (error) {
                                reject(error);
                            }
                        }
                    });
                }).on('error', reject);
            });
        };

        // Fetch page to get total count
        const fetchRikishiPage = (skip = 0) => {
            return new Promise((resolve, reject) => {
                const url = `https://sumo-api.com/api/rikishis?limit=1000&skip=${skip}`;
                https.get(url, (apiRes) => {
                    let data = '';
                    apiRes.on('data', (chunk) => { data += chunk; });
                    apiRes.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(error);
                        }
                    });
                }).on('error', reject);
            });
        };

        sendProgress('Fetching rikishi count from API...');
        const initialResponse = await fetchRikishiPage(0);
        const totalReported = initialResponse.total;
        sendProgress(`API reports ${totalReported} total rikishi`);

        const allRikishis = [];
        let consecutiveNotFound = 0;
        const maxNotFound = 100;

        // Fetch all rikishi
        for (let id = 1; id <= totalReported + 900; id++) {
            const rikishi = await fetchRikishiById(id);

            if (rikishi === null) {
                consecutiveNotFound++;
                if (consecutiveNotFound >= maxNotFound) {
                    sendProgress(`Stopping: ${maxNotFound} consecutive IDs not found`);
                    break;
                }
            } else {
                consecutiveNotFound = 0;
                allRikishis.push(rikishi);

                if (allRikishis.length % 100 === 0) {
                    sendProgress(`Fetched ${allRikishis.length} rikishi (ID ${id})...`);
                }
            }

            if (id % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        sendProgress(`Fetching complete: ${allRikishis.length} records fetched`);
        sendProgress('Starting database import...');

        let imported = 0;
        let skipped = 0;
        let measurementsImported = 0;
        let ranksImported = 0;
        let shikonaImported = 0;

        // Import rikishi
        for (const rikishi of allRikishis) {
            try {
                let birthDate = null;
                if (rikishi.birthDate) {
                    birthDate = new Date(rikishi.birthDate).toISOString().split('T')[0];
                }

                let rikishiId;
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
                    rikishiId = existingRikishi.rows[0].id;
                    await client.query(`
                        UPDATE rikishis SET
                            sumo_db_id = $1, nsk_id = $2, shikona_jp = $3,
                            current_rank = $4, heya = $5, birth_date = $6,
                            shusshin = $7, height = $8, weight = $9, debut = $10,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $11
                    `, [
                        rikishi.sumodbId, rikishi.nskId, rikishi.shikonaJp,
                        rikishi.currentRank, rikishi.heya, birthDate,
                        rikishi.shusshin, rikishi.height, rikishi.weight,
                        rikishi.debut, rikishiId
                    ]);
                } else {
                    const result = await client.query(`
                        INSERT INTO rikishis (
                            sumo_db_id, nsk_id, shikona_en, shikona_jp,
                            current_rank, heya, birth_date, shusshin,
                            height, weight, debut
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        RETURNING id
                    `, [
                        rikishi.sumodbId, rikishi.nskId, rikishi.shikonaEn,
                        rikishi.shikonaJp, rikishi.currentRank, rikishi.heya,
                        birthDate, rikishi.shusshin, rikishi.height,
                        rikishi.weight, rikishi.debut
                    ]);
                    rikishiId = result.rows[0].id;
                }

                // Import rank history
                if (rikishi.rankHistory && rikishi.rankHistory.length > 0) {
                    await client.query('DELETE FROM ranks WHERE rikishi_id = $1', [rikishiId]);
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

                // Import measurement history
                if (rikishi.measurementHistory && rikishi.measurementHistory.length > 0) {
                    await client.query('DELETE FROM measurements WHERE rikishi_id = $1', [rikishiId]);
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

                // Import shikona history
                if (rikishi.shikonaHistory && rikishi.shikonaHistory.length > 0) {
                    await client.query('DELETE FROM shikona WHERE rikishi_id = $1', [rikishiId]);
                    const shikonaValues = [];
                    const shikonaParams = [];
                    let paramIndex = 1;

                    for (const shikona of rikishi.shikonaHistory) {
                        shikonaValues.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
                        shikonaParams.push(
                            rikishiId, shikona.shikonaEn, shikona.shikonaJp,
                            shikona.dateStart, shikona.dateEnd, shikona.current || false
                        );
                        paramIndex += 6;
                        shikonaImported++;
                    }

                    if (shikonaValues.length > 0) {
                        await client.query(`
                            INSERT INTO shikona (rikishi_id, shikona_en, shikona_jp, date_start, date_end, current)
                            VALUES ${shikonaValues.join(', ')}
                        `, shikonaParams);
                    }
                }

                imported++;

                if (imported % 100 === 0) {
                    sendProgress(`Imported ${imported} rikishi...`);
                }
            } catch (error) {
                console.error(`Error importing ${rikishi.shikonaEn}:`, error.message);
                skipped++;
            }
        }

        sendProgress(`Import complete: ${imported} rikishi imported`);
        sendProgress(`Ranks: ${ranksImported}, Measurements: ${measurementsImported}, Shikona: ${shikonaImported}`);
        sendProgress(`Skipped: ${skipped}`);

        res.write('data: {"done": true}\n\n');
        res.end();
    } catch (error) {
        console.error('Import error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    } finally {
        client.release();
    }
});

// Catch-all route to serve React app for any non-API routes (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
