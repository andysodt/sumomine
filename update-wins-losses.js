const { Pool } = require('pg');

const pool = new Pool({
    user: 'andysodt',
    host: 'localhost',
    database: 'sumomine',
    password: '',
    port: 5432,
});

async function updateWinsLosses() {
    console.log('Calculating wins and losses from bouts...\n');

    try {
        // Get all rikishi
        const rikishiResult = await pool.query('SELECT id, shikona_en FROM rikishis ORDER BY id');
        const rikishis = rikishiResult.rows;

        console.log(`Found ${rikishis.length} rikishi to update`);

        let updated = 0;

        for (const rikishi of rikishis) {
            // Count wins where this rikishi is the winner
            const winsResult = await pool.query(
                'SELECT COUNT(*) as wins FROM bouts WHERE winner_en = $1',
                [rikishi.shikona_en]
            );
            const wins = parseInt(winsResult.rows[0].wins);

            // Count losses where this rikishi participated but didn't win
            const lossesResult = await pool.query(`
                SELECT COUNT(*) as losses FROM bouts
                WHERE (east_shikona = $1 OR west_shikona = $1)
                AND winner_en != $1
                AND winner_en IS NOT NULL
            `, [rikishi.shikona_en]);
            const losses = parseInt(lossesResult.rows[0].losses);

            // Update rikishi record
            if (wins > 0 || losses > 0) {
                await pool.query(
                    'UPDATE rikishis SET wins = $1, losses = $2 WHERE id = $3',
                    [wins, losses, rikishi.id]
                );
                updated++;

                if (updated % 100 === 0) {
                    console.log(`Updated ${updated} rikishi...`);
                }
            }
        }

        console.log(`\n=== Update Complete ===`);
        console.log(`Total rikishi updated: ${updated}`);

        // Show some statistics
        const statsResult = await pool.query(`
            SELECT
                COUNT(*) as total_rikishi,
                SUM(wins) as total_wins,
                SUM(losses) as total_losses,
                COUNT(*) FILTER (WHERE wins + losses > 0) as rikishi_with_bouts
            FROM rikishis
        `);

        const stats = statsResult.rows[0];
        console.log(`\n=== Statistics ===`);
        console.log(`Total rikishi: ${stats.total_rikishi}`);
        console.log(`Rikishi with bout data: ${stats.rikishi_with_bouts}`);
        console.log(`Total wins recorded: ${stats.total_wins}`);
        console.log(`Total losses recorded: ${stats.total_losses}`);

        // Show top performers
        const topResult = await pool.query(`
            SELECT shikona_en, wins, losses,
                   (wins + losses) as total_bouts,
                   ROUND((wins::numeric / NULLIF(wins + losses, 0) * 100), 1) as win_rate
            FROM rikishis
            WHERE wins + losses > 0
            ORDER BY win_rate DESC, wins DESC
            LIMIT 10
        `);

        console.log(`\n=== Top 10 by Win Rate ===`);
        topResult.rows.forEach(r => {
            console.log(`${r.shikona_en}: ${r.wins}-${r.losses} (${r.win_rate}% win rate)`);
        });

    } catch (err) {
        console.error('Error updating wins/losses:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

updateWinsLosses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
