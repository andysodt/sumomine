const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: 'andysodt',
    host: 'localhost',
    database: 'sumomine',
    password: '',
    port: 5432,
});

// Normalize string for matching (remove diacritics, lowercase, remove special chars)
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric
}

// Calculate similarity between two strings (simple approach)
function similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    // Check if shorter is contained in longer
    if (longer.includes(shorter)) return 0.8;

    // Count matching characters
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
}

// Find best matching rikishi for a filename
function findBestMatch(filename, rikishiList) {
    const normalizedFilename = normalizeString(filename);

    let bestMatch = null;
    let bestScore = 0;

    for (const rikishi of rikishiList) {
        const normalizedName = normalizeString(rikishi.shikona_en);
        const score = similarity(normalizedFilename, normalizedName);

        if (score > bestScore && score > 0.4) { // Minimum threshold
            bestScore = score;
            bestMatch = rikishi;
        }
    }

    return { match: bestMatch, score: bestScore };
}

async function matchImagesToRikishi(imageDir, options = {}) {
    const {
        minConfidence = 0.5,
        dryRun = false,
        interactive = false
    } = options;

    console.log('Matching images to rikishi...\n');

    try {
        // Get all rikishi from database
        console.log('Loading rikishi from database...');
        const result = await pool.query('SELECT id, shikona_en, shikona_jp, image_url FROM rikishis ORDER BY shikona_en');
        const rikishiList = result.rows;
        console.log(`Found ${rikishiList.length} rikishi in database\n`);

        // Get all image files
        console.log('Scanning image directory...');
        const files = fs.readdirSync(imageDir)
            .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        console.log(`Found ${files.length} image files\n`);

        const matches = [];
        const unmatched = [];

        // Match each image to a rikishi
        for (const filename of files) {
            const { match, score } = findBestMatch(filename, rikishiList);

            if (match && score >= minConfidence) {
                matches.push({
                    filename,
                    rikishiId: match.id,
                    rikishiName: match.shikona_en,
                    currentImage: match.image_url,
                    confidence: score
                });
            } else {
                unmatched.push({ filename, bestScore: score, bestMatch: match?.shikona_en });
            }
        }

        // Display results
        console.log('='.repeat(80));
        console.log('MATCHES');
        console.log('='.repeat(80));

        for (const m of matches) {
            console.log(`✓ ${m.filename}`);
            console.log(`  → ${m.rikishiName} (ID: ${m.rikishiId})`);
            console.log(`  → Confidence: ${(m.confidence * 100).toFixed(1)}%`);
            if (m.currentImage) {
                console.log(`  → Current image: ${m.currentImage}`);
            }
            console.log();
        }

        console.log('='.repeat(80));
        console.log('UNMATCHED');
        console.log('='.repeat(80));

        for (const u of unmatched) {
            console.log(`✗ ${u.filename}`);
            if (u.bestMatch) {
                console.log(`  → Best guess: ${u.bestMatch} (${(u.bestScore * 100).toFixed(1)}% - below threshold)`);
            }
            console.log();
        }

        // Summary
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total images: ${files.length}`);
        console.log(`Matched: ${matches.length}`);
        console.log(`Unmatched: ${unmatched.length}`);
        console.log();

        // Update database
        if (!dryRun && matches.length > 0) {
            console.log('Updating database...');

            let updated = 0;
            for (const m of matches) {
                const imagePath = `/images/${m.filename}`;

                await pool.query(
                    'UPDATE rikishis SET image_url = $1 WHERE id = $2',
                    [imagePath, m.rikishiId]
                );

                updated++;
                console.log(`Updated ${m.rikishiName}: ${imagePath}`);
            }

            console.log(`\n✓ Updated ${updated} rikishi records`);
        } else if (dryRun) {
            console.log('DRY RUN - No database changes made');
            console.log(`Would update ${matches.length} records`);
        }

        // Export mapping file
        const mapping = {
            timestamp: new Date().toISOString(),
            imageDir,
            matches: matches.map(m => ({
                filename: m.filename,
                rikishiId: m.rikishiId,
                rikishiName: m.rikishiName,
                confidence: m.confidence
            })),
            unmatched: unmatched.map(u => ({
                filename: u.filename,
                bestGuess: u.bestMatch,
                score: u.bestScore
            }))
        };

        const mappingFile = path.join(imageDir, 'mapping.json');
        fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
        console.log(`\n✓ Mapping saved to: ${mappingFile}`);

        return { matches, unmatched };

    } catch (err) {
        console.error('Error:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

// Manual matching helper
async function manualMatch(imageFile, rikishiId) {
    try {
        const imagePath = `/images/${path.basename(imageFile)}`;

        await pool.query(
            'UPDATE rikishis SET image_url = $1 WHERE id = $2',
            [imagePath, rikishiId]
        );

        console.log(`✓ Matched ${imageFile} to rikishi ID ${rikishiId}`);

    } catch (err) {
        console.error('Error:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Image to Rikishi Matcher
========================

Automatically matches image files to rikishi in the database based on filename.

Usage:
  node match-images-to-rikishi.js <image-directory> [options]
  node match-images-to-rikishi.js --manual <image-file> <rikishi-id>

Options:
  --dry-run              Show matches without updating database
  --min-confidence <n>   Minimum confidence threshold (0-1, default: 0.5)
  --manual               Manually match a specific image to a rikishi ID

Examples:
  node match-images-to-rikishi.js ./images
  node match-images-to-rikishi.js ./images --dry-run
  node match-images-to-rikishi.js ./images --min-confidence 0.7
  node match-images-to-rikishi.js --manual ./images/terunofuji.jpg 123

How it works:
  1. Scans all image files in the directory
  2. Normalizes filenames (lowercase, remove special chars)
  3. Compares against all rikishi names in database
  4. Matches files with confidence above threshold
  5. Updates database with image paths
  6. Generates mapping.json file with results
        `);
        process.exit(0);
    }

    // Manual mode
    if (args[0] === '--manual') {
        if (args.length < 3) {
            console.error('Error: --manual requires image file and rikishi ID');
            process.exit(1);
        }

        const imageFile = args[1];
        const rikishiId = parseInt(args[2]);

        if (!fs.existsSync(imageFile)) {
            console.error(`Error: Image file not found: ${imageFile}`);
            process.exit(1);
        }

        manualMatch(imageFile, rikishiId)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));

        return;
    }

    // Automatic mode
    const imageDir = args[0];
    const options = {
        dryRun: args.includes('--dry-run'),
        minConfidence: 0.5
    };

    // Parse min-confidence
    const minConfIdx = args.indexOf('--min-confidence');
    if (minConfIdx !== -1 && args[minConfIdx + 1]) {
        options.minConfidence = parseFloat(args[minConfIdx + 1]);
    }

    if (!fs.existsSync(imageDir)) {
        console.error(`Error: Directory not found: ${imageDir}`);
        process.exit(1);
    }

    matchImagesToRikishi(imageDir, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { matchImagesToRikishi, manualMatch };
