import type {
  Rikishi,
  SumoRank,
  BashoData,
  YushoWinner,
  SpecialPrize,
  KimariiteData,
  KimariiteEntity,
  BanzukeData,
  BanzukeEntity,
  TorikumiData,
  TorikumiEntity,
  RikishiMatchData,
  RikishiStatsData,
  SumoApiResponse,
  Basho,
  Bout,
  Kimarite,
  MeasurementData,
  MeasurementEntity,
  RankData,
  RankEntity,
  ShikonaData,
  ShikonaEntity
} from '../types';

export interface RikishiData {
  id: number;
  sumodbId: number;
  nskId: number;
  shikonaEn: string;
  shikonaJp: string;
  currentRank: string;
  heya: string;
  birthDate: string;
  shusshin: string;
  height: number;
  weight: number;
  debut: string;
  updatedAt: string;
}

// Removed local SumoApiResponse interface - using the one from types/index.ts instead

// Use different approach for development vs production
const SUMO_API_BASE_URL = import.meta.env.DEV ? '/api/sumo' : 'https://sumo-api.com/api';

// Helper function to get the correct URL for API calls
const getApiUrl = (endpoint: string) => {
  return `${SUMO_API_BASE_URL}${endpoint}`;
};

// Map Sumo API ranks to our internal rank system
const mapRankToSumoRank = (rank: string | null | undefined): SumoRank => {
  // Handle null, undefined, or empty ranks
  if (!rank || typeof rank !== 'string') {
    return 'Maegashira'; // Default fallback for missing ranks
  }

  const rankStr = rank.toLowerCase();
  if (rankStr.includes('yokozuna')) return 'Yokozuna';
  if (rankStr.includes('ozeki')) return 'Ozeki';
  if (rankStr.includes('sekiwake')) return 'Sekiwake';
  if (rankStr.includes('komusubi')) return 'Komusubi';
  if (rankStr.includes('maegashira')) return 'Maegashira';
  if (rankStr.includes('juryo')) return 'Juryo';
  if (rankStr.includes('makushita')) return 'Makushita';
  if (rankStr.includes('sandanme')) return 'Sandanme';
  if (rankStr.includes('jonidan')) return 'Jonidan';
  if (rankStr.includes('jonokuchi')) return 'Jonokuchi';

  // Additional checks for retired or inactive wrestlers
  if (rankStr.includes('intai')) return 'Maegashira'; // Retired
  if (rankStr.includes('kyujo')) return 'Maegashira'; // Absent

  return 'Maegashira'; // Default fallback
};

// Convert RikishiData to our internal Rikishi format
export const mapRikishiToRikishi = (rikishi: RikishiData): Rikishi => {
  // Ensure we have valid data before processing
  if (!rikishi || !rikishi.id) {
    throw new Error('Invalid rikishi data: missing ID');
  }

  return {
    id: `sumo-api-${rikishi.id}`,
    name: rikishi.shikonaEn || rikishi.shikonaJp || `Rikishi-${rikishi.id}`,
    shikonaEn: rikishi.shikonaEn,
    shikonaJp: rikishi.shikonaJp,
    rank: mapRankToSumoRank(rikishi.currentRank),
    stable: rikishi.heya || 'Unknown',
    weight: typeof rikishi.weight === 'number' ? rikishi.weight : 0,
    height: typeof rikishi.height === 'number' ? rikishi.height : 0,
    birthDate: rikishi.birthDate || '',
    debut: rikishi.debut || '',
    wins: 0, // API doesn't provide aggregate wins/losses
    losses: 0,
    draws: 0,
    // New fields from API
    sumodbId: rikishi.sumodbId,
    nskId: rikishi.nskId,
    currentRank: rikishi.currentRank,
    heya: rikishi.heya,
    shusshin: rikishi.shusshin,
    updatedAt: rikishi.updatedAt,
  };
};

// Map API kimarite to our internal Kimarite type
const mapKimariiteToKimarite = (kimarite: string | undefined): Kimarite | null => {
  if (!kimarite) return null;

  // Clean up the kimarite string and match to our enum
  const cleanKimarite = kimarite.trim();

  // Direct matches for common techniques
  const kimariiteMap: Record<string, Kimarite> = {
    'yorikiri': 'Yorikiri',
    'oshidashi': 'Oshidashi',
    'hatakikomi': 'Hatakikomi',
    'tsukiotoshi': 'Tsukiotoshi',
    'uwatenage': 'Uwatenage',
    'shitatenage': 'Shitatenage',
    'okuridashi': 'Okuridashi',
    'okuritaoshi': 'Okuritaoshi',
    'yoritaoshi': 'Yoritaoshi',
    'sukuinage': 'Sukuinage',
    'kotenage': 'Kotenage',
    'koshinage': 'Koshinage',
    'utchari': 'Utchari',
    'kakenage': 'Kakenage',
    'tsuridashi': 'Tsuridashi',
    'tsuriotoshi': 'Tsuriotoshi',
    'abisetaoshi': 'Abisetaoshi',
    'makiotoshi': 'Makiotoshi',
    'kimetaoshi': 'Kimetaoshi',
    'fusen': 'Fusen',
    'hansoku': 'Hansoku'
  };

  const lowerKimarite = cleanKimarite.toLowerCase();
  return kimariiteMap[lowerKimarite] || 'Yorikiri'; // Default to most common technique
};

// Convert TorikumiData to our internal Bout format
export const mapTorikumiToBout = (torikumi: TorikumiData): Bout => {
  // Ensure we have valid data before processing
  if (!torikumi || !torikumi.id) {
    throw new Error('Invalid torikumi data: missing ID');
  }

  // Create a date for the bout (we'll need to derive this from basho data)
  // For now, use a placeholder date format
  const date = `2024-01-${String(torikumi.day).padStart(2, '0')}`;

  return {
    id: `sumo-api-bout-${torikumi.id}`,
    bashoId: `basho-${torikumi.bashoId}`,
    rikishi1Id: `sumo-api-${torikumi.rikishi1Id}`,
    rikishi2Id: `sumo-api-${torikumi.rikishi2Id}`,
    winnerId: torikumi.winnerId ? `sumo-api-${torikumi.winnerId}` : null,
    kimarite: mapKimariiteToKimarite(torikumi.kimarite),
    date: date,
    day: torikumi.day,
  };
};

// Convert RikishiMatchData to our internal Bout format
export const mapRikishiMatchToBout = (match: RikishiMatchData): Bout => {
  // Ensure we have valid data before processing
  if (!match || !match.bashoId) {
    throw new Error('Invalid match data: missing basho ID');
  }

  // Create a unique ID for the bout using basho, day, and match number
  const boutId = `sumo-api-bout-${match.bashoId}-${match.day}-${match.matchNo}`;

  // Create a date for the bout based on basho ID and day
  // bashoId format is like "202509" (year + month)
  const year = match.bashoId.substring(0, 4);
  const month = match.bashoId.substring(4, 6);
  const date = `${year}-${month}-${String(match.day).padStart(2, '0')}`;

  return {
    id: boutId,
    bashoId: `basho-${match.bashoId}`,
    rikishi1Id: `sumo-api-${match.eastId}`,
    rikishi2Id: `sumo-api-${match.westId}`,
    winnerId: match.winnerId ? `sumo-api-${match.winnerId}` : null,
    kimarite: mapKimariiteToKimarite(match.kimarite),
    date: date,
    day: match.day,
    // Enhanced fields from API
    division: match.division,
    matchNo: match.matchNo,
    eastId: match.eastId,
    eastShikona: match.eastShikona,
    eastRank: match.eastRank,
    westId: match.westId,
    westShikona: match.westShikona,
    westRank: match.westRank,
    winnerEn: match.winnerEn,
    winnerJp: match.winnerJp,
  };
};

// Convert KimariiteData to our internal KimariiteEntity format
export const mapKimariiteToEntity = (kimarite: KimariiteData, totalCount?: number): KimariiteEntity => {
  // Ensure we have valid data before processing
  if (!kimarite || !kimarite.id) {
    throw new Error('Invalid kimarite data: missing ID');
  }

  // Calculate percentage if total count is provided
  const percentage = totalCount && totalCount > 0 ?
    Math.round((kimarite.count / totalCount) * 100 * 100) / 100 : undefined;

  // Calculate additional enhanced fields
  const getRarity = (pct?: number): KimariiteEntity['rarity'] => {
    if (!pct) return undefined;
    if (pct >= 10) return 'Common';
    if (pct >= 5) return 'Uncommon';
    if (pct >= 2) return 'Rare';
    if (pct >= 0.5) return 'Very Rare';
    return 'Extremely Rare';
  };

  const getEffectiveness = (count: number): KimariiteEntity['effectiveness'] => {
    if (count >= 1000) return 'High';
    if (count >= 100) return 'Medium';
    return 'Low';
  };

  const getDaysSinceLastUsed = (lastUsedStr: string | null): number | undefined => {
    if (!lastUsedStr) return undefined;
    try {
      const lastUsedDate = new Date(lastUsedStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastUsedDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return undefined;
    }
  };

  const getPopularityTrend = (lastUsedDays?: number): KimariiteEntity['popularityTrend'] => {
    if (!lastUsedDays) return 'Stable';
    if (lastUsedDays <= 30) return 'Rising';
    if (lastUsedDays <= 180) return 'Stable';
    return 'Declining';
  };

  const lastUsedDaysAgo = getDaysSinceLastUsed(kimarite.lastUsed || null);

  return {
    id: `sumo-api-kimarite-${kimarite.id}`,
    name: kimarite.name || '',
    nameEn: kimarite.nameEn || kimarite.name || '',
    category: kimarite.category || 'Unknown',
    description: kimarite.description || `${kimarite.nameEn || kimarite.name} - A sumo winning technique`,
    count: kimarite.count || 0,
    lastUsed: kimarite.lastUsed || null,
    percentage: percentage,
    // Enhanced calculated fields
    rarity: getRarity(percentage),
    effectiveness: getEffectiveness(kimarite.count || 0),
    popularityTrend: getPopularityTrend(lastUsedDaysAgo),
    lastUsedDaysAgo: lastUsedDaysAgo
  };
};

// Convert MeasurementData to our internal MeasurementEntity format
export const mapMeasurementToEntity = (measurement: MeasurementData, rikishiName?: string, allMeasurements?: MeasurementData[]): MeasurementEntity => {
  // Ensure we have valid data before processing
  if (!measurement || !measurement.id) {
    throw new Error('Invalid measurement data: missing ID');
  }

  // Calculate BMI (Body Mass Index)
  const heightInMeters = measurement.height / 100;
  const bmi = heightInMeters > 0 ? Math.round((measurement.weight / (heightInMeters * heightInMeters)) * 10) / 10 : undefined;

  // Extract year and month from bashoId
  const year = parseInt(measurement.bashoId.slice(0, 4));
  const month = parseInt(measurement.bashoId.slice(4, 6));

  // Calculate season name
  const getSeasonName = (month: number): string => {
    switch (month) {
      case 1: return 'Hatsu Basho (Tokyo)';
      case 3: return 'Haru Basho (Osaka)';
      case 5: return 'Natsu Basho (Tokyo)';
      case 7: return 'Nagoya Basho (Nagoya)';
      case 9: return 'Aki Basho (Tokyo)';
      case 11: return 'Kyushu Basho (Fukuoka)';
      default: return 'Unknown Basho';
    }
  };

  // Calculate BMI category with Sumo-specific classification
  const getBMICategory = (bmi: number | undefined): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'Sumo Elite' => {
    if (!bmi) return 'Normal';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    if (bmi < 40) return 'Obese';
    return 'Sumo Elite'; // Very high BMI typical for elite sumo wrestlers
  };

  // Calculate power index (normalized combination of height and weight)
  const powerIndex = Math.round(((measurement.height / 180) * 0.3 + (measurement.weight / 150) * 0.7) * 100);

  // Calculate weight to height ratio
  const weightHeightRatio = Math.round((measurement.weight / measurement.height) * 100) / 100;

  // Calculate percentiles and comparisons if all measurements are provided
  let heightPercentile: number | undefined;
  let weightPercentile: number | undefined;
  let comparisonToAverage: { heightDiff: number; weightDiff: number; bmiDiff: number } | undefined;

  if (allMeasurements && allMeasurements.length > 0) {
    // Calculate percentiles
    const heights = allMeasurements.map(m => m.height).sort((a, b) => a - b);
    const weights = allMeasurements.map(m => m.weight).sort((a, b) => a - b);

    const heightRank = heights.filter(h => h <= measurement.height).length;
    const weightRank = weights.filter(w => w <= measurement.weight).length;

    heightPercentile = Math.round((heightRank / heights.length) * 100);
    weightPercentile = Math.round((weightRank / weights.length) * 100);

    // Calculate averages
    const avgHeight = allMeasurements.reduce((sum, m) => sum + m.height, 0) / allMeasurements.length;
    const avgWeight = allMeasurements.reduce((sum, m) => sum + m.weight, 0) / allMeasurements.length;
    const avgBMI = allMeasurements.reduce((sum, m) => {
      const h = m.height / 100;
      return sum + (m.weight / (h * h));
    }, 0) / allMeasurements.length;

    comparisonToAverage = {
      heightDiff: Math.round((measurement.height - avgHeight) * 10) / 10,
      weightDiff: Math.round((measurement.weight - avgWeight) * 10) / 10,
      bmiDiff: bmi ? Math.round((bmi - avgBMI) * 10) / 10 : 0
    };
  }

  return {
    id: `sumo-api-measurement-${measurement.id}`,
    bashoId: measurement.bashoId,
    rikishiId: measurement.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${measurement.rikishiId}`,
    height: measurement.height,
    weight: measurement.weight,
    bmi: bmi,
    // Enhanced calculated fields
    bmiCategory: getBMICategory(bmi),
    heightPercentile,
    weightPercentile,
    powerIndex,
    weightHeightRatio,
    year,
    month,
    seasonName: getSeasonName(month),
    comparisonToAverage
  };
};

// Convert RankData to our internal RankEntity format
export const mapRankToEntity = (rank: RankData, rikishiName?: string, allRanks?: RankData[]): RankEntity => {
  // Ensure we have valid data before processing
  if (!rank || !rank.id) {
    throw new Error('Invalid rank data: missing ID');
  }

  // Parse rank string to extract division, number, and side
  const parseRank = (rankString: string) => {
    const parts = rankString.split(' ');
    let division = '';
    let rankNumber: number | undefined;
    let side: 'East' | 'West' | undefined;

    // Extract division (first part)
    if (parts.length > 0) {
      division = parts[0];
    }

    // Extract rank number (if present)
    if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
      rankNumber = parseInt(parts[1]);
    }

    // Extract side (East/West)
    const sideString = parts[parts.length - 1];
    if (sideString === 'East' || sideString === 'West') {
      side = sideString;
    }

    return { division, rankNumber, side };
  };

  const { division, rankNumber, side } = parseRank(rank.rank);

  // Extract year and month from bashoId
  const year = parseInt(rank.bashoId.slice(0, 4));
  const month = parseInt(rank.bashoId.slice(4, 6));

  // Calculate season name
  const getSeasonName = (month: number): string => {
    switch (month) {
      case 1: return 'Hatsu Basho (Tokyo)';
      case 3: return 'Haru Basho (Osaka)';
      case 5: return 'Natsu Basho (Tokyo)';
      case 7: return 'Nagoya Basho (Nagoya)';
      case 9: return 'Aki Basho (Tokyo)';
      case 11: return 'Kyushu Basho (Fukuoka)';
      default: return 'Unknown Basho';
    }
  };

  // Calculate division level (lower number = higher prestige)
  const getDivisionLevel = (division: string): number => {
    switch (division?.toLowerCase()) {
      case 'yokozuna': return 0;
      case 'makuuchi': return 1;
      case 'juryo': return 2;
      case 'makushita': return 3;
      case 'sandanme': return 4;
      case 'jonidan': return 5;
      case 'jonokuchi': return 6;
      default: return 7;
    }
  };

  // Calculate prestige classification
  const getPrestige = (division: string, rankValue: number): 'Elite' | 'Professional' | 'Amateur' | 'Beginner' => {
    const divLevel = getDivisionLevel(division);
    if (divLevel <= 1) return 'Elite'; // Yokozuna, Makuuchi
    if (divLevel <= 2) return 'Professional'; // Juryo
    if (divLevel <= 4) return 'Amateur'; // Makushita, Sandanme
    return 'Beginner'; // Jonidan, Jonokuchi
  };

  // Calculate division position
  const getDivisionPosition = (rankValue: number, division: string): 'Top' | 'Middle' | 'Bottom' => {
    // This is a simplified calculation - in reality would need division-specific thresholds
    const divLevel = getDivisionLevel(division);
    if (divLevel <= 1) {
      // Elite divisions
      if (rankValue <= 305) return 'Top';
      if (rankValue <= 320) return 'Middle';
      return 'Bottom';
    } else {
      // Lower divisions - use relative position
      if (rankValue <= 100) return 'Top';
      if (rankValue <= 200) return 'Middle';
      return 'Bottom';
    }
  };

  // Calculate East/West advantage
  const getEastWestAdvantage = (side?: 'East' | 'West', rankValue?: number): 'East' | 'West' | 'Neutral' => {
    if (!side) return 'Neutral';
    // East side generally considered more prestigious
    return side === 'East' ? 'East' : 'West';
  };

  // Calculate ranking score for comparison
  const getRankingScore = (rankValue: number, divisionLevel: number): number => {
    // Lower rank value and division level = higher score
    return Math.max(0, 1000 - (rankValue + (divisionLevel * 100)));
  };

  // Calculate next rank target
  const getNextRankTarget = (division: string, rankNumber?: number, side?: 'East' | 'West'): string => {
    if (division?.toLowerCase() === 'yokozuna') return 'Maintain Yokozuna';
    if (division?.toLowerCase() === 'ozeki') return 'Promotion to Yokozuna';
    if (division?.toLowerCase() === 'sekiwake') return 'Promotion to Ozeki';
    if (division?.toLowerCase() === 'komusubi') return 'Promotion to Sekiwake';

    // For numbered ranks, aim for promotion within division or to next division
    if (rankNumber && rankNumber > 1) {
      return `${division} ${rankNumber - 1} ${side || 'East'}`;
    }

    // Aim for next higher division
    const nextDivisions: Record<string, string> = {
      'juryo': 'Makuuchi',
      'makushita': 'Juryo',
      'sandanme': 'Makushita',
      'jonidan': 'Sandanme',
      'jonokuchi': 'Jonidan'
    };

    return nextDivisions[division?.toLowerCase()] || 'Promotion';
  };

  // Calculate percentiles and trends if all ranks are provided
  let rankPercentile: number | undefined;
  let rankingTrend: 'Rising' | 'Stable' | 'Declining' | undefined;

  if (allRanks && allRanks.length > 0) {
    // Filter ranks in same division for percentile calculation
    const sameDivisionRanks = allRanks.filter(r => {
      const { division: rDiv } = parseRank(r.rank);
      return rDiv?.toLowerCase() === division?.toLowerCase();
    });

    if (sameDivisionRanks.length > 0) {
      const rankValues = sameDivisionRanks.map(r => r.rankValue).sort((a, b) => a - b);
      const betterRanks = rankValues.filter(rv => rv <= rank.rankValue).length;
      rankPercentile = Math.round((betterRanks / rankValues.length) * 100);
    }

    // Simple trend calculation based on rank position
    if (rank.rankValue <= 300) rankingTrend = 'Rising';
    else if (rank.rankValue <= 400) rankingTrend = 'Stable';
    else rankingTrend = 'Declining';
  }

  const divisionLevel = getDivisionLevel(division || '');
  const prestige = getPrestige(division || '', rank.rankValue);
  const divisionPosition = getDivisionPosition(rank.rankValue, division || '');
  const eastWestAdvantage = getEastWestAdvantage(side, rank.rankValue);
  const rankingScore = getRankingScore(rank.rankValue, divisionLevel);
  const nextRankTarget = getNextRankTarget(division || '', rankNumber, side);

  return {
    id: `sumo-api-rank-${rank.id}`,
    bashoId: rank.bashoId,
    rikishiId: rank.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${rank.rikishiId}`,
    rankValue: rank.rankValue,
    rank: rank.rank,
    division: division || 'Unknown',
    rankNumber: rankNumber,
    side: side,
    // Enhanced calculated fields
    year,
    month,
    seasonName: getSeasonName(month),
    divisionLevel,
    prestige,
    rankPercentile,
    rankingTrend,
    divisionPosition,
    eastWestAdvantage,
    rankingScore,
    nextRankTarget
  };
};

// Convert ShikonaData to our internal ShikonaEntity format
export const mapShikonaToEntity = (shikona: ShikonaData, rikishiName?: string, allShikonas?: ShikonaData[]): ShikonaEntity => {
  // Ensure we have valid data before processing
  if (!shikona || !shikona.id) {
    throw new Error('Invalid shikona data: missing ID');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoId: string) => {
    if (bashoId.length >= 6) {
      const year = parseInt(bashoId.substring(0, 4));
      const month = parseInt(bashoId.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(shikona.bashoId);

  // Calculate season name
  const getSeasonName = (month: number): string => {
    switch (month) {
      case 1: return 'Hatsu Basho (Tokyo)';
      case 3: return 'Haru Basho (Osaka)';
      case 5: return 'Natsu Basho (Tokyo)';
      case 7: return 'Nagoya Basho (Nagoya)';
      case 9: return 'Aki Basho (Tokyo)';
      case 11: return 'Kyushu Basho (Fukuoka)';
      default: return 'Unknown Basho';
    }
  };

  // Analyze name types
  const englishName = shikona.shikonaEn?.trim() || '';
  const japaneseName = shikona.shikonaJp?.trim() || '';

  const getNameType = (): 'Both' | 'English Only' | 'Japanese Only' | 'Neither' => {
    const hasEnglish = englishName.length > 0;
    const hasJapanese = japaneseName.length > 0;

    if (hasEnglish && hasJapanese) return 'Both';
    if (hasEnglish) return 'English Only';
    if (hasJapanese) return 'Japanese Only';
    return 'Neither';
  };

  // Calculate name lengths
  const nameLength = {
    english: englishName.length,
    japanese: japaneseName.length,
    total: englishName.length + japaneseName.length
  };

  // Analyze Japanese characters
  const hasKanji = /[\u4e00-\u9faf]/.test(japaneseName);
  const hasHiragana = /[\u3040-\u309f]/.test(japaneseName);
  const hasKatakana = /[\u30a0-\u30ff]/.test(japaneseName);

  // Calculate name complexity
  const getNameComplexity = (): 'Simple' | 'Moderate' | 'Complex' => {
    const totalLength = nameLength.total;
    if (totalLength <= 10) return 'Simple';
    if (totalLength <= 20) return 'Moderate';
    return 'Complex';
  };

  // Estimate name origin
  const getNameOrigin = (): 'Traditional Japanese' | 'Modern Japanese' | 'Foreign' | 'Mixed' => {
    if (!japaneseName && englishName) {
      // Check if English name contains non-ASCII characters
      if (/[^\x00-\x7F]/.test(englishName)) return 'Mixed';
      return 'Foreign';
    }

    if (japaneseName) {
      if (hasKanji && hasHiragana) return 'Traditional Japanese';
      if (hasKatakana) return 'Modern Japanese';
      if (hasHiragana) return 'Traditional Japanese';
    }

    if (englishName && japaneseName) return 'Mixed';
    return 'Modern Japanese';
  };

  // Calculate years since used
  const currentYear = new Date().getFullYear();
  const yearsSinceUsed = year ? currentYear - year : undefined;

  // Determine name trend
  const getNameTrend = (): 'Historic' | 'Recent' | 'Current' => {
    if (!yearsSinceUsed) return 'Current';
    if (yearsSinceUsed <= 1) return 'Current';
    if (yearsSinceUsed <= 3) return 'Recent';
    return 'Historic';
  };

  // Determine display preference
  const getDisplayPreference = (): 'English' | 'Japanese' | 'Both' => {
    if (englishName && japaneseName) return 'Both';
    if (englishName) return 'English';
    if (japaneseName) return 'Japanese';
    return 'English';
  };

  // Calculate name history and popularity if all shikonas provided
  let nameHistory: { isFirst: boolean; isLatest: boolean; totalNames: number } | undefined;
  let namePopularity: 'Unique' | 'Uncommon' | 'Common' | 'Very Common' | undefined;
  let isCurrentName: boolean | undefined;
  let nameChangeNumber: number | undefined;

  if (allShikonas && allShikonas.length > 0) {
    // Find all shikonas for this rikishi
    const rikishiShikonas = allShikonas
      .filter(s => s.rikishiId === shikona.rikishiId)
      .sort((a, b) => a.bashoId.localeCompare(b.bashoId));

    if (rikishiShikonas.length > 0) {
      const currentIndex = rikishiShikonas.findIndex(s => s.id === shikona.id);
      nameHistory = {
        isFirst: currentIndex === 0,
        isLatest: currentIndex === rikishiShikonas.length - 1,
        totalNames: rikishiShikonas.length
      };
      isCurrentName = nameHistory.isLatest;
      nameChangeNumber = currentIndex + 1;
    }

    // Calculate popularity based on similar names
    const similarNames = allShikonas.filter(s =>
      s.shikonaEn === shikona.shikonaEn || s.shikonaJp === shikona.shikonaJp
    ).length;

    if (similarNames === 1) namePopularity = 'Unique';
    else if (similarNames <= 3) namePopularity = 'Uncommon';
    else if (similarNames <= 7) namePopularity = 'Common';
    else namePopularity = 'Very Common';
  }

  return {
    id: `sumo-api-shikona-${shikona.id}`,
    bashoId: shikona.bashoId,
    rikishiId: shikona.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${shikona.rikishiId}`,
    shikonaEn: englishName,
    shikonaJp: japaneseName,
    year: year,
    month: month,
    // Enhanced calculated fields
    seasonName: month ? getSeasonName(month) : undefined,
    nameType: getNameType(),
    nameLength,
    hasKanji,
    hasHiragana,
    hasKatakana,
    nameComplexity: getNameComplexity(),
    nameOrigin: getNameOrigin(),
    isCurrentName,
    nameChangeNumber,
    nameHistory,
    namePopularity,
    yearsSinceUsed,
    nameTrend: getNameTrend(),
    displayPreference: getDisplayPreference()
  };
};

// Convert BanzukeData to our internal BanzukeEntity format (updated for new API structure)
export const mapBanzukeToEntity = (banzuke: BanzukeData, bashoId?: string, division?: string): BanzukeEntity => {
  // Ensure we have valid data before processing
  if (!banzuke || !banzuke.rikishiID) {
    throw new Error('Invalid banzuke data: missing rikishiID');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoIdStr: string) => {
    if (bashoIdStr && bashoIdStr.length >= 6) {
      const year = parseInt(bashoIdStr.substring(0, 4));
      const month = parseInt(bashoIdStr.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(bashoId || '');

  // Calculate season name
  const getSeasonName = (month: number): string => {
    switch (month) {
      case 1: return 'Hatsu Basho (Tokyo)';
      case 3: return 'Haru Basho (Osaka)';
      case 5: return 'Natsu Basho (Tokyo)';
      case 7: return 'Nagoya Basho (Nagoya)';
      case 9: return 'Aki Basho (Tokyo)';
      case 11: return 'Kyushu Basho (Fukuoka)';
      default: return 'Unknown Basho';
    }
  };

  // Enhanced calculations
  const totalMatches = (banzuke.wins || 0) + (banzuke.losses || 0);
  const winRate = totalMatches > 0 ? (banzuke.wins || 0) / totalMatches : 0;

  // Calculate performance classification
  const getPerformance = (winRate: number, totalMatches: number): 'Excellent' | 'Good' | 'Average' | 'Poor' => {
    if (totalMatches < 5) return 'Average'; // Not enough matches to judge
    if (winRate >= 0.8) return 'Excellent';
    if (winRate >= 0.65) return 'Good';
    if (winRate >= 0.4) return 'Average';
    return 'Poor';
  };

  // Analyze kimarite statistics from the record
  const kimariiteStats = banzuke.record?.reduce((acc, match) => {
    if (match.result === 'win' && match.kimarite) {
      acc[match.kimarite] = (acc[match.kimarite] || 0) + 1;
    }
    return acc;
  }, {} as { [technique: string]: number }) || {};

  // Determine opponent quality based on match records
  const getOpponentQuality = (record: any[]): 'Elite' | 'Strong' | 'Average' | 'Weak' => {
    if (!record || record.length === 0) return 'Average';
    // This is a simplified calculation - could be enhanced with actual opponent ranking data
    const opponentCount = record.length;
    if (opponentCount >= 15) return 'Elite';
    if (opponentCount >= 10) return 'Strong';
    if (opponentCount >= 5) return 'Average';
    return 'Weak';
  };

  // Calculate consistency rating based on win/loss pattern
  const getConsistencyRating = (record: any[]): number => {
    if (!record || record.length < 3) return 0.5;

    let streakChanges = 0;
    let currentStreakType = record[0]?.result;

    for (let i = 1; i < record.length; i++) {
      if (record[i].result !== currentStreakType) {
        streakChanges++;
        currentStreakType = record[i].result;
      }
    }

    // Lower streak changes = higher consistency
    const maxChanges = record.length - 1;
    return Math.max(0, 1 - (streakChanges / maxChanges));
  };

  return {
    id: `sumo-api-banzuke-${bashoId}-${banzuke.rikishiID}`,
    bashoId: bashoId || '',
    rikishiId: banzuke.rikishiID.toString(),
    rikishiName: banzuke.shikonaEn || `Rikishi ${banzuke.rikishiID}`,
    rank: banzuke.rank,
    rankValue: banzuke.rankValue,
    side: banzuke.side,
    division: division || 'Unknown',
    wins: banzuke.wins || 0,
    losses: banzuke.losses || 0,
    absences: banzuke.absences || 0,
    record: banzuke.record || [],
    year: year,
    month: month,
    // Enhanced calculated fields
    winRate: winRate,
    totalMatches: totalMatches,
    performance: getPerformance(winRate, totalMatches),
    kimariiteStats: kimariiteStats,
    opponentQuality: getOpponentQuality(banzuke.record || []),
    consistencyRating: getConsistencyRating(banzuke.record || []),
    seasonName: month ? getSeasonName(month) : undefined
  };
};

// Convert TorikumiData (from rikishi matches API) to our internal TorikumiEntity format
export const mapTorikumiToEntity = (torikumi: TorikumiData): TorikumiEntity => {
  // Ensure we have valid data before processing
  if (!torikumi || !torikumi.bashoId) {
    throw new Error('Invalid torikumi data: missing bashoId');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoIdStr: string) => {
    if (bashoIdStr && bashoIdStr.length >= 6) {
      const year = parseInt(bashoIdStr.substring(0, 4));
      const month = parseInt(bashoIdStr.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(torikumi.bashoId);

  // Calculate season name
  const getSeasonName = (month: number): string => {
    switch (month) {
      case 1: return 'Hatsu Basho (Tokyo)';
      case 3: return 'Haru Basho (Osaka)';
      case 5: return 'Natsu Basho (Tokyo)';
      case 7: return 'Nagoya Basho (Nagoya)';
      case 9: return 'Aki Basho (Tokyo)';
      case 11: return 'Kyushu Basho (Fukuoka)';
      default: return 'Unknown Basho';
    }
  };

  // Enhanced match analysis
  const getMatchType = (day: number): 'Regular' | 'Senshuraku' | 'Playoff' | 'Special' => {
    if (day === 15) return 'Senshuraku';  // Final day
    if (day >= 13) return 'Special';      // Important final days
    return 'Regular';
  };

  // Analyze rank difference for upset probability
  const getRankDifference = (eastRank: string, westRank: string): number => {
    // This is a simplified calculation - could be enhanced with actual rank values
    const getRankValue = (rank: string): number => {
      if (rank.includes('Yokozuna')) return 1;
      if (rank.includes('Ozeki')) return 2;
      if (rank.includes('Sekiwake')) return 3;
      if (rank.includes('Komusubi')) return 4;
      if (rank.includes('Maegashira')) {
        const num = parseInt(rank.match(/\d+/)?.[0] || '0');
        return 4 + num;
      }
      return 50; // Lower divisions
    };

    return Math.abs(getRankValue(eastRank) - getRankValue(westRank));
  };

  // Determine upset probability
  const getUpsetProbability = (winnerId: number, eastId: number, westId: number, eastRank: string, westRank: string): 'Expected' | 'Minor Upset' | 'Major Upset' | 'Shocking' => {
    const rankDiff = getRankDifference(eastRank, westRank);
    const isEastWinner = winnerId === eastId;
    const higherRankedWon = (isEastWinner && eastRank < westRank) || (!isEastWinner && westRank < eastRank);

    if (higherRankedWon || rankDiff <= 1) return 'Expected';
    if (rankDiff <= 3) return 'Minor Upset';
    if (rankDiff <= 7) return 'Major Upset';
    return 'Shocking';
  };

  // Analyze kimarite (technique)
  const analyzeTechnique = (kimarite: string) => {
    // Simplified technique analysis - could be enhanced with actual technique database
    const commonTechniques = ['oshidashi', 'yorikiri', 'hatakikomi', 'uwatenage'];
    const rareTechniques = ['utchari', 'kamimaezumo', 'tokkurinage'];

    return {
      category: 'throws', // Could be categorized as throws, pushes, pulls, etc.
      frequency: commonTechniques.includes(kimarite.toLowerCase()) ? 0.8 : rareTechniques.includes(kimarite.toLowerCase()) ? 0.1 : 0.5,
      difficulty: rareTechniques.includes(kimarite.toLowerCase()) ? 'Extreme' as const :
                 commonTechniques.includes(kimarite.toLowerCase()) ? 'Easy' as const : 'Medium' as const
    };
  };

  const rankDiff = getRankDifference(torikumi.eastRank, torikumi.westRank);
  const matchType = getMatchType(torikumi.day);
  const upsetProb = getUpsetProbability(torikumi.winnerId, torikumi.eastId, torikumi.westId, torikumi.eastRank, torikumi.westRank);
  const technique = analyzeTechnique(torikumi.kimarite);

  return {
    id: `sumo-api-match-${torikumi.bashoId}-${torikumi.day}-${torikumi.matchNo}`,
    bashoId: torikumi.bashoId,
    day: torikumi.day,
    matchNo: torikumi.matchNo,
    division: torikumi.division,
    eastId: torikumi.eastId.toString(),
    eastShikona: torikumi.eastShikona,
    eastRank: torikumi.eastRank,
    westId: torikumi.westId.toString(),
    westShikona: torikumi.westShikona,
    westRank: torikumi.westRank,
    kimarite: torikumi.kimarite,
    winnerId: torikumi.winnerId.toString(),
    winnerEn: torikumi.winnerEn,
    winnerJp: torikumi.winnerJp,
    year: year,
    month: month,
    // Enhanced calculated fields
    seasonName: month ? getSeasonName(month) : undefined,
    matchType: matchType,
    rankDifference: rankDiff,
    upsetProbability: upsetProb,
    matchImportance: (torikumi.day >= 13 || rankDiff <= 2) ? 'High' : (torikumi.day >= 8) ? 'Medium' : 'Low',
    technique: technique,

    // Legacy fields for backward compatibility
    rikishi1Id: torikumi.eastId.toString(),
    rikishi1Name: torikumi.eastShikona,
    rikishi2Id: torikumi.westId.toString(),
    rikishi2Name: torikumi.westShikona,
    winnerName: torikumi.winnerEn,
    isDecided: true, // API data is always decided
    matchNumber: torikumi.matchNo
  };
};

export class SumoApiService {
  // Fetch all rikishi from the API
  static async fetchRikishi(): Promise<RikishiData[]> {
    try {
      const allRikishi: RikishiData[] = [];
      let skip = 0;
      const limit = 1000; // API's maximum limit per request
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching rikishi batch: skip=${skip}, limit=${limit}`);
        const response = await fetch(getApiUrl(`/rikishis?limit=${limit}&skip=${skip}`));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SumoApiResponse<RikishiData> = await response.json();
        const records = data.records || [];

        if (records.length === 0) {
          hasMore = false;
        } else {
          allRikishi.push(...records);
          skip += limit;

          // Check if we've fetched all available records
          if (skip >= data.total) {
            hasMore = false;
          }

          console.log(`Fetched ${records.length} rikishi, total so far: ${allRikishi.length}/${data.total}`);
        }
      }

      console.log(`Successfully fetched all ${allRikishi.length} rikishi from API`);
      return allRikishi;
    } catch (error) {
      console.error('Error fetching rikishi data:', error);
      throw new Error('Failed to fetch rikishi data from Sumo API');
    }
  }

  // Fetch active rikishi only (those with current ranks)
  static async fetchActiveRikishi(): Promise<RikishiData[]> {
    try {
      const allRikishi = await this.fetchRikishi();
      // Filter for active rikishi (those with current ranks)
      return allRikishi.filter(rikishi =>
        rikishi.currentRank &&
        rikishi.currentRank !== 'Intai' && // Not retired
        rikishi.currentRank !== 'Kyujo'    // Not absent
      );
    } catch (error) {
      console.error('Error fetching active rikishi:', error);
      throw error;
    }
  }

  // Fetch top division rikishi (Makuuchi)
  static async fetchTopDivisionRikishi(): Promise<RikishiData[]> {
    try {
      const activeRikishi = await this.fetchActiveRikishi();
      return activeRikishi.filter(rikishi =>
        rikishi.currentRank.includes('Yokozuna') ||
        rikishi.currentRank.includes('Ozeki') ||
        rikishi.currentRank.includes('Sekiwake') ||
        rikishi.currentRank.includes('Komusubi') ||
        rikishi.currentRank.includes('Maegashira')
      );
    } catch (error) {
      console.error('Error fetching top division rikishi:', error);
      throw error;
    }
  }

  // Fetch specific rikishi by ID
  static async fetchRikishiById(id: number): Promise<RikishiData | null> {
    try {
      const response = await fetch(getApiUrl(`/rikishi/${id}`));
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching rikishi ${id}:`, error);
      throw error;
    }
  }

  // Convert enhanced BashoData to internal Basho format
  static convertBashoToBasho(basho: BashoData, bashoId: string): Basho {
    // Extract year and month from basho date
    const year = basho.date ? basho.date.substring(0, 4) : '';
    const month = basho.date ? basho.date.substring(4, 6) : '';
    const bashoName = `${year}年${month}月場所` || 'Unknown Basho';

    return {
      id: `basho-${bashoId}`,
      name: bashoName,
      startDate: basho.startDate || '',
      endDate: basho.endDate || '',
      division: 'Makuuchi', // Default to top division
      participants: [], // Will be populated later
      bouts: [], // Will be populated later
      // Enhanced fields from API
      date: basho.date,
      location: basho.location,
      yusho: basho.yusho,
      specialPrizes: basho.specialPrizes
    };
  }

  // Fetch enhanced basho data using the correct API endpoint format
  static async fetchEnhancedBashoById(bashoId: string): Promise<BashoData | null> {
    try {
      const response = await fetch(getApiUrl(`/basho/${bashoId}`));
      if (!response.ok) {
        return null;
      }
      const data: BashoData = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching enhanced basho ${bashoId}:`, error);
      return null;
    }
  }

  // Fetch multiple enhanced basho records
  static async fetchEnhancedBashos(bashoIds?: string[]): Promise<Basho[]> {
    const bashos: Basho[] = [];

    // Default basho IDs for recent tournaments if none provided
    const defaultBashoIds = ['202409', '202407', '202405', '202403', '202401', '202311'];
    const idsToFetch = bashoIds || defaultBashoIds;

    for (const bashoId of idsToFetch) {
      try {
        const bashoData = await this.fetchEnhancedBashoById(bashoId);
        if (bashoData) {
          const convertedBasho = this.convertBashoToBasho(bashoData, bashoId);
          bashos.push(convertedBasho);
        }
      } catch (error) {
        console.warn(`Failed to fetch basho ${bashoId}:`, error);
      }
    }

    return bashos;
  }

  // Convert API data to internal format
  static convertToRikishi(rikishiList: RikishiData[]): Rikishi[] {
    const rikishiArray: Rikishi[] = [];
    const errors: string[] = [];

    rikishiList.forEach((rikishi, index) => {
      try {
        const convertedRikishi = mapRikishiToRikishi(rikishi);
        rikishiArray.push(convertedRikishi);
      } catch (error) {
        const errorMsg = `Failed to convert rikishi at index ${index} (ID: ${rikishi?.id || 'unknown'}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    });

    if (errors.length > 0) {
      console.warn(`Conversion completed with ${errors.length} errors:`, errors);
    }

    console.log(`Successfully converted ${rikishiArray.length} of ${rikishiList.length} rikishi`);
    return rikishiArray;
  }

  // Fetch all basho (tournaments) - Try multiple approaches
  static async fetchBashos(): Promise<BashoData[]> {
    const bashos: BashoData[] = [];

    try {
      // First try the bashos endpoint
      try {
        const response = await fetch(getApiUrl('/bashos'));
        if (response.ok) {
          const data: SumoApiResponse<BashoData> = await response.json();
          return data.records || [];
        }
      } catch (error) {
        console.log('bashos endpoint not available:', error);
      }

      // If that fails, try to construct basho data from individual endpoints
      console.log('Attempting to construct basho data from individual endpoints...');

      // Try some common basho IDs to find valid ones
      const bashoIds = [700, 701, 702, 703, 704, 705, 710, 720, 730]; // Recent years

      for (const id of bashoIds) {
        try {
          const response = await fetch(getApiUrl(`/basho/${id}`));
          if (response.ok) {
            const bashoData = await response.json();

            // Only add if it has valid data (not empty dates)
            if (bashoData && bashoData.startDate && bashoData.startDate !== "0001-01-01T00:00:00Z") {
              bashos.push({
                id: id,
                date: bashoData.date || `${new Date(bashoData.startDate).getFullYear()}${(new Date(bashoData.startDate).getMonth() + 1).toString().padStart(2, '0')}`,
                name: bashoData.name || `Basho ${id}`,
                year: new Date(bashoData.startDate).getFullYear() || 2024,
                month: new Date(bashoData.startDate).getMonth() + 1 || 1,
                location: bashoData.location || 'Unknown',
                startDate: bashoData.startDate,
                endDate: bashoData.endDate,
                yusho: bashoData.yusho || [],
                specialPrizes: bashoData.specialPrizes || []
              });
            }
          }
        } catch (error) {
          // Continue to next ID
        }
      }

      return bashos;

    } catch (error) {
      console.error('Error fetching basho data:', error);
      // Return empty array instead of throwing to not break the import
      return [];
    }
  }

  // Fetch specific basho by ID
  static async fetchBashoById(id: number): Promise<BashoData | null> {
    try {
      const response = await fetch(getApiUrl(`/basho/${id}`));
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching basho ${id}:`, error);
      throw error;
    }
  }

  // Fetch all kimarite (winning techniques)
  static async fetchKimarites(): Promise<KimariiteData[]> {
    // Use the paginated fetchKimarite method with default sorting
    return this.fetchKimarite('count');
  }

  // Fetch kimarite by ID
  static async fetchKimariteById(id: number): Promise<KimariiteData | null> {
    try {
      const response = await fetch(getApiUrl(`/kimarite/${id}`));
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching kimarite ${id}:`, error);
      throw error;
    }
  }

  // Fetch banzuke (rankings) for a specific basho and division
  static async fetchBanzuke(bashoId: string, division: string): Promise<BanzukeData[]> {
    try {
      const response = await fetch(getApiUrl(`/basho/${bashoId}/banzuke/${division}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No banzuke found for basho ${bashoId}, division ${division}`);
          return [];
        }
        throw new Error(`Failed to fetch banzuke for basho ${bashoId}, division ${division}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns an object with division data, extract the wrestlers array
      if (data && Array.isArray(data)) {
        return data;
      }

      console.warn(`Unexpected response format for banzuke API:`, data);
      return [];
    } catch (error) {
      console.error(`Error fetching banzuke for basho ${bashoId}, division ${division}:`, error);
      return []; // Return empty array instead of throwing to allow continued processing
    }
  }

  // Fetch banzuke data for multiple divisions
  static async fetchAllBanzuke(bashoIds?: string[], divisions?: string[]): Promise<BanzukeData[]> {
    const allBanzukeData: BanzukeData[] = [];
    const errors: string[] = [];

    // Default values if not provided
    const defaultBashoIds = bashoIds || ['202409', '202407', '202405']; // Recent tournaments
    const defaultDivisions = divisions || ['Makuuchi', 'Juryo', 'Makushita'];

    console.log(`Fetching banzuke data for ${defaultBashoIds.length} basho(s) and ${defaultDivisions.length} division(s)...`);

    for (const bashoId of defaultBashoIds) {
      for (const division of defaultDivisions) {
        try {
          const banzukeData = await this.fetchBanzuke(bashoId, division);

          // Add bashoId and division to each entry for context
          const enrichedData = banzukeData.map(entry => ({
            ...entry,
            bashoId: bashoId,
            division: division
          }));

          allBanzukeData.push(...enrichedData);

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          errors.push(`Failed to fetch banzuke for basho ${bashoId}, division ${division}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    if (errors.length > 0) {
      console.warn(`Banzuke fetch completed with ${errors.length} errors:`, errors.slice(0, 5));
    }

    console.log(`Successfully collected ${allBanzukeData.length} banzuke entries`);
    return allBanzukeData;
  }

  // Note: The torikumi endpoint doesn't exist - torikumi data is available through rikishi matches
  // These methods are kept for backward compatibility but will use rikishi matches as source
  static async fetchTorikumi(bashoId: number): Promise<TorikumiData[]> {
    console.warn('Direct torikumi endpoint not available. Use fetchAllRikishiMatches instead for comprehensive data.');
    return [];
  }

  // Fetch torikumi for a specific basho and day
  static async fetchTorikumiByDay(bashoId: number, day: number): Promise<TorikumiData[]> {
    console.warn('Direct torikumi endpoint not available. Use fetchAllRikishiMatches instead for comprehensive data.');
    return [];
  }

  // Fetch matches for a specific rikishi (actual API endpoint structure)
  static async fetchRikishiMatches(rikishiId: number): Promise<TorikumiData[]> {
    try {
      console.log(`Attempting to fetch matches for rikishi ${rikishiId}...`);
      const allMatches: TorikumiData[] = [];
      let skip = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const url = getApiUrl(`/rikishi/${rikishiId}/matches?limit=${limit}&skip=${skip}`);
        console.log(`Request URL: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`No matches found for rikishi ID ${rikishiId}`);
            return [];
          }
          throw new Error(`Failed to fetch matches for rikishi ${rikishiId}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // The API returns a paginated response
        const records = data.records || [];

        if (records.length === 0) {
          hasMore = false;
        } else {
          allMatches.push(...records);
          skip += limit;

          if (skip >= data.total) {
            hasMore = false;
          }

          console.log(`Fetched ${records.length} matches for rikishi ${rikishiId}, total so far: ${allMatches.length}/${data.total}`);
        }
      }

      console.log(`Successfully fetched all ${allMatches.length} matches for rikishi ${rikishiId}`);
      return allMatches;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error(`CORS or network error fetching matches for rikishi ${rikishiId}:`, error);
        console.error('This might be due to CORS restrictions when accessing sumo-api.com from the browser');
      } else {
        console.error(`Error fetching matches for rikishi ${rikishiId}:`, error);
      }
      return []; // Return empty array instead of throwing to allow continued processing
    }
  }

  // Fetch all available torikumi data by getting matches for multiple rikishi
  static async fetchAllRikishiMatches(rikishiIds?: number[]): Promise<TorikumiData[]> {
    try {
      // If no specific rikishi IDs provided, use default set
      if (!rikishiIds || rikishiIds.length === 0) {
        rikishiIds = [1, 2, 3, 4, 5]; // Default to top 5 rikishi for testing
        console.log('Using default rikishi IDs for testing:', rikishiIds);
      }

      console.log(`Fetching matches for ${rikishiIds.length} rikishi...`);
      const allMatches: TorikumiData[] = [];
      const seenMatchIds = new Set<string>();

      // Fetch matches for each rikishi (limited to avoid overwhelming the API)
      const limitedRikishiIds = rikishiIds.slice(0, 10); // Limit to first 10 rikishi to avoid too many API calls

      for (const rikishiId of limitedRikishiIds) {
        try {
          const matches = await this.fetchRikishiMatches(rikishiId);

          // Filter out duplicate matches (same match appears for both participants)
          for (const match of matches) {
            const matchId = `${match.bashoId}-${match.day}-${match.matchNo}`;
            if (!seenMatchIds.has(matchId)) {
              seenMatchIds.add(matchId);
              allMatches.push(match);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch matches for rikishi ${rikishiId}:`, error);
          // Continue processing other rikishi
        }
      }

      console.log(`Successfully fetched ${allMatches.length} unique matches`);
      return allMatches;
    } catch (error) {
      console.error('Error fetching match data:', error);
      throw new Error('Failed to fetch match data from Sumo API');
    }
  }

  // Legacy method - kept for backward compatibility but redirects to new method
  static async fetchAllTorikumi(rikishiIds?: number[]): Promise<TorikumiData[]> {
    // This method is kept for backward compatibility but now returns empty array
    // since the actual API doesn't have a global torikumi endpoint
    console.warn('fetchAllTorikumi is deprecated. Use fetchAllRikishiMatches instead.');
    return [];
  }

  // Fetch rikishi statistics
  static async fetchRikishiStats(rikishiId: number): Promise<RikishiStatsData | null> {
    try {
      const response = await fetch(getApiUrl(`/rikishi/${rikishiId}/stats`));
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching stats for rikishi ${rikishiId}:`, error);
      throw error;
    }
  }

  // Fetch current/latest basho
  static async fetchCurrentBasho(): Promise<BashoData | null> {
    try {
      const bashos = await this.fetchBashos();
      if (bashos.length === 0) return null;

      // Sort by year and month to get the most recent
      const sortedBashos = bashos.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      return sortedBashos[0];
    } catch (error) {
      console.error('Error fetching current basho:', error);
      throw error;
    }
  }

  // Fetch current banzuke (rankings for latest basho)
  static async fetchCurrentBanzuke(): Promise<BanzukeData[]> {
    try {
      const currentBasho = await this.fetchCurrentBasho();
      if (!currentBasho) {
        throw new Error('No current basho found');
      }
      return await this.fetchBanzuke(currentBasho.id.toString(), 'Makuuchi');
    } catch (error) {
      console.error('Error fetching current banzuke:', error);
      throw error;
    }
  }

  // Fetch all kimarite (winning techniques) from the API
  static async fetchKimarite(sortBy: 'count' | 'kimarite' | 'lastusage' = 'count'): Promise<KimariiteData[]> {
    try {
      const allKimarite: KimariiteData[] = [];
      let skip = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching kimarite batch: skip=${skip}, limit=${limit}, sortBy=${sortBy}`);
        const response = await fetch(getApiUrl(`/kimarite/${sortBy}?limit=${limit}&skip=${skip}`));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SumoApiResponse<KimariiteData> = await response.json();
        const records = data.records || [];

        if (records.length === 0) {
          hasMore = false;
        } else {
          allKimarite.push(...records);
          skip += limit;

          if (skip >= data.total) {
            hasMore = false;
          }

          console.log(`Fetched ${records.length} kimarite, total so far: ${allKimarite.length}/${data.total}`);
        }
      }

      console.log(`Successfully fetched all ${allKimarite.length} kimarite from API`);
      return allKimarite;
    } catch (error) {
      console.error('Error fetching kimarite data:', error);
      throw new Error('Failed to fetch kimarite data from Sumo API');
    }
  }

  // Fetch a specific kimarite by name
  static async fetchKimariiteByName(kimariiteName: string): Promise<KimariiteData | null> {
    try {
      const response = await fetch(getApiUrl(`/kimarite/${encodeURIComponent(kimariiteName)}`));
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Kimarite not found
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const kimarite: KimariiteData = await response.json();
      return kimarite;
    } catch (error) {
      console.error(`Error fetching kimarite ${kimariiteName}:`, error);
      return null;
    }
  }

  // Convert kimarite data to internal format
  static convertKimariiteToEntities(kimariiteList: KimariiteData[]): KimariiteEntity[] {
    const entities: KimariiteEntity[] = [];
    const errors: string[] = [];

    // Calculate total count for percentage calculations
    const totalCount = kimariiteList.reduce((sum, k) => sum + (k.count || 0), 0);

    // Sort by count to assign ranks
    const sortedKimarite = [...kimariiteList].sort((a, b) => (b.count || 0) - (a.count || 0));

    sortedKimarite.forEach((kimarite, index) => {
      try {
        const entity = mapKimariiteToEntity(kimarite, totalCount);
        // Add ranking information
        entity.rank = index + 1;
        entities.push(entity);
      } catch (error) {
        errors.push(`Failed to convert kimarite at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors converting kimarite data:', errors);
    }

    return entities;
  }

  // Fetch measurements for a specific rikishi
  static async fetchMeasurements(rikishiId: number): Promise<MeasurementData[]> {
    try {
      const response = await fetch(getApiUrl(`/measurements?rikishiId=${rikishiId}`));

      if (!response.ok) {
        throw new Error(`Failed to fetch measurements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns an array directly for measurements
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching measurements:', error);
      throw error;
    }
  }

  // Fetch measurements for multiple rikishi
  static async fetchAllMeasurements(rikishiIds: number[]): Promise<MeasurementEntity[]> {
    const allMeasurementData: MeasurementData[] = [];
    const errors: string[] = [];

    // First, collect all measurement data
    for (const rikishiId of rikishiIds) {
      try {
        const measurements = await this.fetchMeasurements(rikishiId);
        allMeasurementData.push(...measurements);
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Failed to fetch measurements for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Then convert all measurements to entities with full dataset for calculations
    const allMeasurements: MeasurementEntity[] = [];
    allMeasurementData.forEach(measurement => {
      try {
        const entity = mapMeasurementToEntity(measurement, undefined, allMeasurementData);
        allMeasurements.push(entity);
      } catch (error) {
        errors.push(`Failed to convert measurement ${measurement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors fetching measurement data:', errors);
    }

    return allMeasurements;
  }

  // Convert MeasurementData array to MeasurementEntity array
  static convertMeasurementsToEntities(measurementList: MeasurementData[], rikishiMap?: Map<number, string>): MeasurementEntity[] {
    const entities: MeasurementEntity[] = [];
    const errors: string[] = [];

    measurementList.forEach((measurement, index) => {
      try {
        const rikishiName = rikishiMap?.get(measurement.rikishiId);
        const entity = mapMeasurementToEntity(measurement, rikishiName, measurementList);
        entities.push(entity);
      } catch (error) {
        errors.push(`Failed to convert measurement at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors converting measurement data:', errors);
    }

    return entities;
  }

  // Fetch ranks for a specific rikishi
  static async fetchRanks(rikishiId: number): Promise<RankData[]> {
    try {
      const response = await fetch(getApiUrl(`/ranks?rikishiId=${rikishiId}`));

      if (!response.ok) {
        throw new Error(`Failed to fetch ranks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns an array directly for ranks
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching ranks:', error);
      throw error;
    }
  }

  // Fetch ranks for multiple rikishi
  static async fetchAllRanks(rikishiIds: number[]): Promise<RankEntity[]> {
    const allRankData: RankData[] = [];
    const errors: string[] = [];

    console.log(`Fetching ranks for ${rikishiIds.length} rikishi...`);

    // First, fetch all rikishi data to get their names
    const rikishiMap = new Map<number, string>();
    try {
      for (const rikishiId of rikishiIds) {
        try {
          const rikishiData = await this.fetchRikishiById(rikishiId);
          if (rikishiData) {
            const name = rikishiData.shikonaEn || rikishiData.shikonaJp || `Rikishi ${rikishiId}`;
            rikishiMap.set(rikishiId, name);
          }
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`Failed to fetch rikishi data for ${rikishiId}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error fetching rikishi names for ranks:', error);
    }

    // Then collect all rank data
    for (const rikishiId of rikishiIds) {
      try {
        const ranks = await this.fetchRanks(rikishiId);
        allRankData.push(...ranks);
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Failed to fetch ranks for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Finally convert all ranks to entities with proper rikishi names
    const allRanks: RankEntity[] = [];
    allRankData.forEach(rank => {
      try {
        const rikishiName = rikishiMap.get(rank.rikishiId);
        const entity = mapRankToEntity(rank, rikishiName, allRankData);
        allRanks.push(entity);
      } catch (error) {
        errors.push(`Failed to convert rank ${rank.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors fetching rank data:', errors);
    }

    console.log(`Successfully processed ${allRanks.length} rank entities with proper names`);
    return allRanks;
  }

  // Convert RankData array to RankEntity array
  static convertRanksToEntities(rankList: RankData[], rikishiMap?: Map<number, string>): RankEntity[] {
    const entities: RankEntity[] = [];
    const errors: string[] = [];

    rankList.forEach((rank, index) => {
      try {
        const rikishiName = rikishiMap?.get(rank.rikishiId);
        const entity = mapRankToEntity(rank, rikishiName, rankList);
        entities.push(entity);
      } catch (error) {
        errors.push(`Failed to convert rank at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors converting rank data:', errors);
    }

    console.log(`Successfully converted ${entities.length} rank entities`);
    return entities;
  }

  // Fetch shikonas (fighting names) for a specific rikishi
  static async fetchShikonas(rikishiId: number): Promise<ShikonaData[]> {
    try {
      const response = await fetch(getApiUrl(`/shikonas?rikishiId=${rikishiId}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No shikonas found for rikishi ID ${rikishiId}`);
          return [];
        }
        throw new Error(`Failed to fetch shikonas for rikishi ${rikishiId}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns an array directly for shikonas
      if (!Array.isArray(data)) {
        console.warn(`Unexpected response format for shikonas API:`, data);
        return [];
      }

      return data;
    } catch (error) {
      console.error(`Error fetching shikonas for rikishi ${rikishiId}:`, error);
      return []; // Return empty array instead of throwing to allow continued processing
    }
  }

  // Fetch shikonas for multiple rikishi
  static async fetchAllShikonas(rikishiIds: number[]): Promise<ShikonaEntity[]> {
    const allShikonaData: ShikonaData[] = [];
    const errors: string[] = [];

    console.log(`Fetching shikonas for ${rikishiIds.length} rikishi...`);

    // First, collect all raw shikona data
    for (const rikishiId of rikishiIds) {
      try {
        const shikonas = await this.fetchShikonas(rikishiId);
        allShikonaData.push(...shikonas);

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        errors.push(`Failed to fetch shikonas for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Collected ${allShikonaData.length} shikonas from API`);

    // Then convert all shikonas to entities with full dataset for enhanced calculations
    const allShikonas: ShikonaEntity[] = [];
    allShikonaData.forEach(shikona => {
      try {
        // Pass the full dataset for enhanced calculations like name popularity
        const entity = mapShikonaToEntity(shikona, undefined, allShikonaData);
        allShikonas.push(entity);
      } catch (error) {
        errors.push(`Failed to convert shikona ${shikona.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn(`Shikona processing completed with ${errors.length} errors:`, errors.slice(0, 5));
    }

    console.log(`Successfully processed ${allShikonas.length} shikona entities`);
    return allShikonas;
  }

  // Fetch all banzuke data and convert to entities
  static async fetchAllBanzukeEntities(): Promise<BanzukeEntity[]> {
    const allBanzuke: BanzukeEntity[] = [];
    const errors: string[] = [];

    try {
      const banzukeData = await this.fetchAllBanzuke();

      // Convert to entities with enhanced mapping
      banzukeData.forEach(banzuke => {
        try {
          // Extract bashoId and division from the enriched data
          const bashoId = (banzuke as any).bashoId;
          const division = (banzuke as any).division;

          const entity = mapBanzukeToEntity(banzuke, bashoId, division);
          allBanzuke.push(entity);
        } catch (error) {
          errors.push(`Failed to convert banzuke for rikishi ${banzuke.rikishiID}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (errors.length > 0) {
        console.warn(`Banzuke conversion completed with ${errors.length} errors:`, errors.slice(0, 5));
      }

      console.log(`Successfully processed ${allBanzuke.length} banzuke entities`);

    } catch (error) {
      console.error(`Failed to fetch banzuke data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return allBanzuke;
  }

  // Fetch all torikumi data and convert to entities (using rikishi matches as source)
  static async fetchAllTorikumiEntities(bashoIds?: number[]): Promise<TorikumiEntity[]> {
    const allTorikumi: TorikumiEntity[] = [];
    const errors: string[] = [];

    try {
      // Use the rikishi matches API since direct torikumi endpoint doesn't exist
      const rikishiIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // Top 20 rikishi
      const torikumiData = await this.fetchAllRikishiMatches(rikishiIds);

      console.log(`Processing ${torikumiData.length} torikumi matches...`);

      // Convert to entities with enhanced mapping
      torikumiData.forEach(torikumi => {
        try {
          const entity = mapTorikumiToEntity(torikumi);
          allTorikumi.push(entity);
        } catch (error) {
          errors.push(`Failed to convert match ${torikumi.bashoId}-${torikumi.day}-${torikumi.matchNo}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (errors.length > 0) {
        console.warn(`Torikumi conversion completed with ${errors.length} errors:`, errors.slice(0, 5));
      }

      console.log(`Successfully processed ${allTorikumi.length} torikumi entities`);

    } catch (error) {
      console.error(`Failed to fetch torikumi data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return allTorikumi;
  }

  // Convert ShikonaData array to ShikonaEntity array
  static convertShikonasToEntities(shikonaList: ShikonaData[], rikishiMap?: Map<number, string>): ShikonaEntity[] {
    const entities: ShikonaEntity[] = [];
    const errors: string[] = [];

    shikonaList.forEach((shikona, index) => {
      try {
        const rikishiName = rikishiMap?.get(shikona.rikishiId);
        const entity = mapShikonaToEntity(shikona, rikishiName, shikonaList);
        entities.push(entity);
      } catch (error) {
        errors.push(`Failed to convert shikona at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors converting shikona data:', errors);
    }

    return entities;
  }

  // Fetch enhanced bouts by converting rikishi matches
  static async fetchEnhancedBouts(rikishiIds?: number[]): Promise<Bout[]> {
    try {
      console.log('Fetching enhanced bout data...');
      const matchData = await this.fetchAllRikishiMatches(rikishiIds);

      if (matchData.length === 0) {
        console.log('No match data found');
        return [];
      }

      console.log(`Converting ${matchData.length} matches to enhanced bouts...`);
      const bouts: Bout[] = [];
      const errors: string[] = [];

      for (const match of matchData) {
        try {
          const bout = mapRikishiMatchToBout(match);
          bouts.push(bout);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to convert match ${match.bashoId}-${match.day}-${match.matchNo}: ${errorMessage}`);
        }
      }

      if (errors.length > 0) {
        console.warn(`Encountered ${errors.length} errors during conversion:`, errors.slice(0, 5));
      }

      console.log(`Successfully converted ${bouts.length} enhanced bouts`);
      return bouts;
    } catch (error) {
      console.error('Error fetching enhanced bouts:', error);
      throw error;
    }
  }
}