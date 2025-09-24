import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import { rikishi, basho, bouts, kimarite, measurements, ranks, shikonas, banzuke, torikumi } from './db/schema.js';
import type { NewRikishi, NewBasho, NewBout } from './db/schema.js';

config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/sumomine'
});
const db = drizzle(client);

const sampleRikishi: NewRikishi[] = [
  {
    id: '1',
    name: 'Terunofuji Haruo',
    shikonaEn: 'Terunofuji',
    shikonaJp: '照ノ富士春雄',
    rank: 'Yokozuna',
    stable: 'Isegahama',
    weight: 192,
    height: 192,
    birthDate: '1991-11-29',
    debut: '2011-05',
    wins: 450,
    losses: 200,
    draws: 5,
    sumodbId: 12345,
    nskId: 6789,
    currentRank: 'Yokozuna',
    heya: 'Isegahama',
    shusshin: 'Mongolia'
  },
  {
    id: '2',
    name: 'Kiribayama Tetsuo',
    shikonaEn: 'Kiribayama',
    shikonaJp: '霧馬山鐵雄',
    rank: 'Ozeki',
    stable: 'Michinoku',
    weight: 176,
    height: 185,
    birthDate: '1996-04-25',
    debut: '2016-03',
    wins: 320,
    losses: 180,
    draws: 2,
    sumodbId: 23456,
    nskId: 7890,
    currentRank: 'Ozeki',
    heya: 'Michinoku',
    shusshin: 'Mongolia'
  },
  {
    id: '3',
    name: 'Endo Shota',
    shikonaEn: 'Endo',
    shikonaJp: '遠藤聖大',
    rank: 'Maegashira 1',
    stable: 'Oitekaze',
    weight: 155,
    height: 183,
    birthDate: '1990-10-19',
    debut: '2013-03',
    wins: 280,
    losses: 220,
    draws: 8,
    sumodbId: 34567,
    nskId: 8901,
    currentRank: 'Maegashira 1',
    heya: 'Oitekaze',
    shusshin: 'Japan'
  },
  {
    id: '4',
    name: 'Takakeisho Takanobu',
    shikonaEn: 'Takakeisho',
    shikonaJp: '貴景勝貴信',
    rank: 'Ozeki',
    stable: 'Tokitsukaze',
    weight: 170,
    height: 175,
    birthDate: '1996-08-05',
    debut: '2014-09',
    wins: 380,
    losses: 160,
    draws: 3,
    sumodbId: 45678,
    nskId: 9012,
    currentRank: 'Ozeki',
    heya: 'Tokitsukaze',
    shusshin: 'Japan'
  },
  {
    id: '5',
    name: 'Tobizaru Masaya',
    shikonaEn: 'Tobizaru',
    shikonaJp: '翔猿正也',
    rank: 'Maegashira 3',
    stable: 'Oitekaze',
    weight: 148,
    height: 175,
    birthDate: '1992-04-11',
    debut: '2017-03',
    wins: 220,
    losses: 180,
    draws: 4,
    sumodbId: 56789,
    nskId: 123,
    currentRank: 'Maegashira 3',
    heya: 'Oitekaze',
    shusshin: 'Japan'
  }
];

const sampleBasho: NewBasho[] = [
  {
    id: 'basho-2024-11',
    name: 'Kyushu Basho 2024',
    startDate: '2024-11-10',
    endDate: '2024-11-24',
    division: 'Makuuchi',
    participants: [],
    bouts: []
  },
  {
    id: 'basho-2024-09',
    name: 'Aki Basho 2024',
    startDate: '2024-09-08',
    endDate: '2024-09-22',
    division: 'Makuuchi',
    participants: [],
    bouts: []
  }
];

const sampleBouts: NewBout[] = [
  {
    id: 'bout-1',
    bashoId: 'basho-2024-11',
    rikishi1Id: '1',
    rikishi2Id: '2',
    winnerId: '1',
    kimarite: 'yorikiri',
    date: '2024-11-15',
    day: 6,
    division: 'Makuuchi',
    matchNo: 1,
    eastId: 12345,
    eastShikona: 'Terunofuji',
    eastRank: 'Yokozuna',
    westId: 23456,
    westShikona: 'Kiribayama',
    westRank: 'Ozeki',
    winnerEn: 'Terunofuji',
    winnerJp: '照ノ富士'
  },
  {
    id: 'bout-2',
    bashoId: 'basho-2024-11',
    rikishi1Id: '3',
    rikishi2Id: '4',
    winnerId: '4',
    kimarite: 'oshidashi',
    date: '2024-11-16',
    day: 7,
    division: 'Makuuchi',
    matchNo: 2,
    eastId: 34567,
    eastShikona: 'Endo',
    eastRank: 'Maegashira 1',
    westId: 45678,
    westShikona: 'Takakeisho',
    westRank: 'Ozeki',
    winnerEn: 'Takakeisho',
    winnerJp: '貴景勝'
  }
];

const sampleKimarite = [
  {
    id: '1',
    name: 'yorikiri',
    nameEn: 'Force Out',
    category: 'Yori',
    description: 'Forcing opponent out by frontal pressure',
    count: 150,
    lastUsed: '2024-11-15',
    percentage: 25.5,
    rarity: 'Common',
    effectiveness: 'High',
    popularityTrend: 'Stable',
    lastUsedDaysAgo: 5
  },
  {
    id: '2',
    name: 'oshidashi',
    nameEn: 'Push Out',
    category: 'Oshi',
    description: 'Pushing opponent out with hands',
    count: 120,
    lastUsed: '2024-11-16',
    percentage: 20.3,
    rarity: 'Common',
    effectiveness: 'High',
    popularityTrend: 'Rising',
    lastUsedDaysAgo: 4
  },
  {
    id: '3',
    name: 'uwatenage',
    nameEn: 'Overarm Throw',
    category: 'Nage',
    description: 'Throwing with upper grip',
    count: 85,
    lastUsed: '2024-11-10',
    percentage: 14.4,
    rarity: 'Uncommon',
    effectiveness: 'Medium',
    popularityTrend: 'Declining',
    lastUsedDaysAgo: 10
  }
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  await client.connect();

  try {
    // Insert sample rikishi
    console.log('📝 Inserting rikishi...');
    await db.insert(rikishi).values(sampleRikishi);
    console.log(`✅ Inserted ${sampleRikishi.length} rikishi`);

    // Insert sample basho
    console.log('📝 Inserting basho...');
    await db.insert(basho).values(sampleBasho);
    console.log(`✅ Inserted ${sampleBasho.length} basho`);

    // Insert sample bouts
    console.log('📝 Inserting bouts...');
    await db.insert(bouts).values(sampleBouts);
    console.log(`✅ Inserted ${sampleBouts.length} bouts`);

    // Insert sample kimarite
    console.log('📝 Inserting kimarite...');
    await db.insert(kimarite).values(sampleKimarite);
    console.log(`✅ Inserted ${sampleKimarite.length} kimarite`);

    // Insert sample measurements
    console.log('📝 Inserting measurements...');
    const sampleMeasurements = [
      {
        id: 'measure-1',
        bashoId: 'basho-2024-11',
        rikishiId: '1',
        rikishiName: 'Terunofuji',
        height: 192,
        weight: 192,
        bmi: 52.1,
        bmiCategory: 'Obese',
        heightPercentile: 95,
        weightPercentile: 98,
        powerIndex: 95,
        weightHeightRatio: 1.0,
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        comparisonToAverage: { height: '+12cm', weight: '+40kg' }
      },
      {
        id: 'measure-2',
        bashoId: 'basho-2024-11',
        rikishiId: '3',
        rikishiName: 'Endo',
        height: 183,
        weight: 155,
        bmi: 46.3,
        bmiCategory: 'Overweight',
        heightPercentile: 75,
        weightPercentile: 45,
        powerIndex: 72,
        weightHeightRatio: 0.85,
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        comparisonToAverage: { height: '+3cm', weight: '+3kg' }
      }
    ];
    await db.insert(measurements).values(sampleMeasurements);
    console.log(`✅ Inserted ${sampleMeasurements.length} measurements`);

    // Insert sample ranks
    console.log('📝 Inserting ranks...');
    const sampleRanks = [
      {
        id: 'rank-1',
        bashoId: 'basho-2024-11',
        rikishiId: '1',
        rikishiName: 'Terunofuji',
        rank: 'Yokozuna',
        division: 'Makuuchi',
        rankNumber: 1,
        side: 'East',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        isPromotion: false,
        isDemotion: false,
        previousRank: 'Yokozuna',
        rankChange: 'Same'
      },
      {
        id: 'rank-2',
        bashoId: 'basho-2024-11',
        rikishiId: '2',
        rikishiName: 'Kiribayama',
        rank: 'Ozeki',
        division: 'Makuuchi',
        rankNumber: 2,
        side: 'East',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        isPromotion: true,
        isDemotion: false,
        previousRank: 'Sekiwake',
        rankChange: 'Promoted'
      }
    ];
    await db.insert(ranks).values(sampleRanks);
    console.log(`✅ Inserted ${sampleRanks.length} ranks`);

    // Insert sample shikonas
    console.log('📝 Inserting shikonas...');
    const sampleShikonas = [
      {
        id: 'shikona-1',
        bashoId: 'basho-2024-11',
        rikishiId: '1',
        rikishiName: 'Terunofuji',
        shikona: 'Terunofuji',
        shikonaEn: 'Terunofuji',
        shikonaJp: '照ノ富士',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        isNewShikona: false,
        previousShikona: 'Terunofuji',
        shikonaHistory: []
      },
      {
        id: 'shikona-2',
        bashoId: 'basho-2024-11',
        rikishiId: '3',
        rikishiName: 'Endo',
        shikona: 'Endo',
        shikonaEn: 'Endo',
        shikonaJp: '遠藤',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu',
        isNewShikona: false,
        previousShikona: 'Endo',
        shikonaHistory: []
      }
    ];
    await db.insert(shikonas).values(sampleShikonas);
    console.log(`✅ Inserted ${sampleShikonas.length} shikonas`);

    // Insert sample banzuke
    console.log('📝 Inserting banzuke...');
    const sampleBanzuke = [
      {
        id: 'banzuke-1',
        bashoId: 'basho-2024-11',
        division: 'Makuuchi',
        rank: 'Yokozuna',
        side: 'East',
        rikishiId: '1',
        rikishiName: 'Terunofuji',
        stable: 'Isegahama',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu'
      },
      {
        id: 'banzuke-2',
        bashoId: 'basho-2024-11',
        division: 'Makuuchi',
        rank: 'Ozeki',
        side: 'East',
        rikishiId: '2',
        rikishiName: 'Kiribayama',
        stable: 'Michinoku',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu'
      }
    ];
    await db.insert(banzuke).values(sampleBanzuke);
    console.log(`✅ Inserted ${sampleBanzuke.length} banzuke records`);

    // Insert sample torikumi
    console.log('📝 Inserting torikumi...');
    const sampleTorikumi = [
      {
        id: 'torikumi-1',
        bashoId: 'basho-2024-11',
        division: 'Makuuchi',
        day: 1,
        matchNo: 1,
        eastId: 12345,
        eastShikona: 'Terunofuji',
        eastRank: 'Yokozuna',
        westId: 23456,
        westShikona: 'Kiribayama',
        westRank: 'Ozeki',
        winnerId: 12345,
        kimarite: 'yorikiri',
        winnerEn: 'Terunofuji',
        winnerJp: '照ノ富士',
        year: 2024,
        month: 11,
        seasonName: 'Kyushu'
      }
    ];
    await db.insert(torikumi).values(sampleTorikumi);
    console.log(`✅ Inserted ${sampleTorikumi.length} torikumi records`);

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(console.error);
}

export default seed;