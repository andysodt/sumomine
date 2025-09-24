/**
 * Script to import all wrestler data from Sumo API
 * This will fetch all rikishi data and save it to a JSON file for bulk import
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUMO_API_BASE_URL = 'https://www.sumo-api.com/api';

// Map Sumo API ranks to our internal rank system
const mapRankToSumoRank = (rank) => {
  if (!rank || typeof rank !== 'string') return 'Maegashira'; // Handle null/undefined ranks

  if (rank.includes('Yokozuna')) return 'Yokozuna';
  if (rank.includes('Ozeki')) return 'Ozeki';
  if (rank.includes('Sekiwake')) return 'Sekiwake';
  if (rank.includes('Komusubi')) return 'Komusubi';
  if (rank.includes('Maegashira')) return 'Maegashira';
  if (rank.includes('Juryo')) return 'Juryo';
  if (rank.includes('Makushita')) return 'Makushita';
  if (rank.includes('Sandanme')) return 'Sandanme';
  if (rank.includes('Jonidan')) return 'Jonidan';
  if (rank.includes('Jonokuchi')) return 'Jonokuchi';
  return 'Maegashira'; // Default fallback
};

// Convert RikishiData to our internal Wrestler format
const mapRikishiToWrestler = (rikishi) => {
  return {
    id: `sumo-api-${rikishi.id}`,
    name: rikishi.shikonaEn || rikishi.shikonaJp || 'Unknown',
    rank: mapRankToSumoRank(rikishi.currentRank),
    stable: rikishi.heya || 'Unknown',
    weight: Number(rikishi.weight) || 0,
    height: Number(rikishi.height) || 0,
    birthDate: rikishi.birthDate || '',
    debut: rikishi.debut || '',
    wins: 0, // API doesn't provide aggregate wins/losses
    losses: 0,
    draws: 0,
  };
};

async function fetchAllRikishi() {
  try {
    console.log('🔄 Fetching all rikishi data from Sumo API...');

    const response = await fetch(`${SUMO_API_BASE_URL}/rikishis`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Found ${data.total} total rikishi records`);

    // Convert to internal format
    const wrestlers = data.records.map(mapRikishiToWrestler);

    // Filter out invalid entries
    const validWrestlers = wrestlers.filter(wrestler =>
      wrestler.name &&
      wrestler.name.trim() !== '' &&
      wrestler.name !== 'Unknown'
    );

    console.log(`✅ Converted ${validWrestlers.length} valid wrestlers`);

    // Save to JSON file
    const outputPath = path.join(__dirname, '../src/data/all-wrestlers.json');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(validWrestlers, null, 2));
    console.log(`💾 Saved wrestler data to: ${outputPath}`);

    // Print some statistics
    const rankCounts = validWrestlers.reduce((acc, wrestler) => {
      acc[wrestler.rank] = (acc[wrestler.rank] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Wrestler counts by rank:');
    Object.entries(rankCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([rank, count]) => {
        console.log(`  ${rank}: ${count}`);
      });

    return validWrestlers;

  } catch (error) {
    console.error('❌ Error fetching rikishi data:', error);
    throw error;
  }
}

// Run the import
fetchAllRikishi()
  .then((wrestlers) => {
    console.log(`\n🎉 Successfully imported ${wrestlers.length} wrestlers!`);
    console.log('Data is ready for use in the application.');
  })
  .catch((error) => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });

export { fetchAllRikishi, mapRikishiToWrestler };