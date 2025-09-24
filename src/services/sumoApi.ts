import {
  Rikishi,
  SumoRank,
  BashoData,
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

export interface SumoApiResponse {
  total: number;
  records: RikishiData[];
}

const SUMO_API_BASE_URL = '/api/sumo';

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
    rank: mapRankToSumoRank(rikishi.currentRank),
    stable: rikishi.heya || 'Unknown',
    weight: typeof rikishi.weight === 'number' ? rikishi.weight : 0,
    height: typeof rikishi.height === 'number' ? rikishi.height : 0,
    birthDate: rikishi.birthDate || '',
    debut: rikishi.debut || '',
    wins: 0, // API doesn't provide aggregate wins/losses
    losses: 0,
    draws: 0,
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

  return {
    id: `sumo-api-kimarite-${kimarite.id}`,
    name: kimarite.name || '',
    nameEn: kimarite.nameEn || kimarite.name || '',
    category: kimarite.category || 'Unknown',
    description: kimarite.description || `${kimarite.nameEn || kimarite.name} - A sumo winning technique`,
    count: kimarite.count || 0,
    lastUsed: kimarite.lastUsed || null,
    percentage: percentage
  };
};

// Convert MeasurementData to our internal MeasurementEntity format
export const mapMeasurementToEntity = (measurement: MeasurementData, rikishiName?: string): MeasurementEntity => {
  // Ensure we have valid data before processing
  if (!measurement || !measurement.id) {
    throw new Error('Invalid measurement data: missing ID');
  }

  // Calculate BMI (Body Mass Index)
  const heightInMeters = measurement.height / 100;
  const bmi = heightInMeters > 0 ? Math.round((measurement.weight / (heightInMeters * heightInMeters)) * 10) / 10 : undefined;

  return {
    id: `sumo-api-measurement-${measurement.id}`,
    bashoId: measurement.bashoId,
    rikishiId: measurement.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${measurement.rikishiId}`,
    height: measurement.height,
    weight: measurement.weight,
    bmi: bmi
  };
};

// Convert RankData to our internal RankEntity format
export const mapRankToEntity = (rank: RankData, rikishiName?: string): RankEntity => {
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

  return {
    id: `sumo-api-rank-${rank.id}`,
    bashoId: rank.bashoId,
    rikishiId: rank.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${rank.rikishiId}`,
    rankValue: rank.rankValue,
    rank: rank.rank,
    division: division || 'Unknown',
    rankNumber: rankNumber,
    side: side
  };
};

// Convert ShikonaData to our internal ShikonaEntity format
export const mapShikonaToEntity = (shikona: ShikonaData, rikishiName?: string): ShikonaEntity => {
  // Ensure we have valid data before processing
  if (!shikona || !shikona.id) {
    throw new Error('Invalid shikona data: missing ID');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoId: string) => {
    if (bashoId.length === 6) {
      const year = parseInt(bashoId.substring(0, 4));
      const month = parseInt(bashoId.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(shikona.bashoId);

  return {
    id: `sumo-api-shikona-${shikona.id}`,
    bashoId: shikona.bashoId,
    rikishiId: shikona.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${shikona.rikishiId}`,
    shikonaEn: shikona.shikonaEn || '',
    shikonaJp: shikona.shikonaJp || '',
    year: year,
    month: month
  };
};

// Convert BanzukeData to our internal BanzukeEntity format
export const mapBanzukeToEntity = (banzuke: BanzukeData, rikishiName?: string): BanzukeEntity => {
  // Ensure we have valid data before processing
  if (!banzuke || !banzuke.id) {
    throw new Error('Invalid banzuke data: missing ID');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoId: number) => {
    const bashoStr = bashoId.toString();
    if (bashoStr.length === 6) {
      const year = parseInt(bashoStr.substring(0, 4));
      const month = parseInt(bashoStr.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(banzuke.bashoId);

  return {
    id: `sumo-api-banzuke-${banzuke.id}`,
    bashoId: banzuke.bashoId.toString(),
    rikishiId: banzuke.rikishiId.toString(),
    rikishiName: rikishiName || `Rikishi ${banzuke.rikishiId}`,
    rank: banzuke.rank,
    side: banzuke.side,
    division: banzuke.division,
    year: year,
    month: month
  };
};

// Convert TorikumiData to our internal TorikumiEntity format
export const mapTorikumiToEntity = (torikumi: TorikumiData, rikishiMap?: Map<number, string>): TorikumiEntity => {
  // Ensure we have valid data before processing
  if (!torikumi || !torikumi.id) {
    throw new Error('Invalid torikumi data: missing ID');
  }

  // Parse bashoId to extract year and month (format: YYYYMM)
  const parseBashoId = (bashoId: number) => {
    const bashoStr = bashoId.toString();
    if (bashoStr.length === 6) {
      const year = parseInt(bashoStr.substring(0, 4));
      const month = parseInt(bashoStr.substring(4, 6));
      return { year: isNaN(year) ? undefined : year, month: isNaN(month) ? undefined : month };
    }
    return { year: undefined, month: undefined };
  };

  const { year, month } = parseBashoId(torikumi.bashoId);

  // Get rikishi names from the map if provided
  const rikishi1Name = rikishiMap?.get(torikumi.rikishi1Id) || `Rikishi ${torikumi.rikishi1Id}`;
  const rikishi2Name = rikishiMap?.get(torikumi.rikishi2Id) || `Rikishi ${torikumi.rikishi2Id}`;
  const winnerName = torikumi.winnerId ? (rikishiMap?.get(torikumi.winnerId) || `Rikishi ${torikumi.winnerId}`) : undefined;

  return {
    id: `sumo-api-torikumi-${torikumi.id}`,
    bashoId: torikumi.bashoId.toString(),
    day: torikumi.day,
    division: torikumi.division,
    rikishi1Id: torikumi.rikishi1Id.toString(),
    rikishi1Name: rikishi1Name,
    rikishi2Id: torikumi.rikishi2Id.toString(),
    rikishi2Name: rikishi2Name,
    winnerId: torikumi.winnerId?.toString(),
    winnerName: winnerName,
    kimarite: torikumi.kimarite,
    time: torikumi.time,
    isDecided: torikumi.isDecided,
    year: year,
    month: month,
    matchNumber: torikumi.id // Use the original ID as match number for ordering
  };
};

export class SumoApiService {
  // Fetch all rikishi from the API
  static async fetchRikishi(): Promise<RikishiData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/rikishis`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse = await response.json();
      return data.records || [];
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
      const response = await fetch(`${SUMO_API_BASE_URL}/rikishi/${id}`);
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

  // Convert BashoData to internal Basho format
  static convertBashoToBasho(basho: BashoData): Basho {
    return {
      id: `basho-${basho.id}`,
      name: basho.name || `Basho ${basho.year}/${basho.month}`,
      startDate: basho.startDate || '',
      endDate: basho.endDate || '',
      division: 'Makuuchi', // Default to top division
      participants: [], // Will be populated later
      bouts: [] // Will be populated later
    };
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
        const response = await fetch(`${SUMO_API_BASE_URL}/bashos`);
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
          const response = await fetch(`${SUMO_API_BASE_URL}/basho/${id}`);
          if (response.ok) {
            const bashoData = await response.json();

            // Only add if it has valid data (not empty dates)
            if (bashoData && bashoData.startDate && bashoData.startDate !== "0001-01-01T00:00:00Z") {
              bashos.push({
                id: id,
                name: bashoData.name || `Basho ${id}`,
                year: new Date(bashoData.startDate).getFullYear() || 2024,
                month: new Date(bashoData.startDate).getMonth() + 1 || 1,
                venue: bashoData.venue || 'Unknown',
                startDate: bashoData.startDate,
                endDate: bashoData.endDate,
                updatedAt: bashoData.updatedAt || new Date().toISOString()
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
      const response = await fetch(`${SUMO_API_BASE_URL}/basho/${id}`);
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
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/kimarites`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<KimariiteData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('Error fetching kimarite data:', error);
      throw new Error('Failed to fetch kimarite data from Sumo API');
    }
  }

  // Fetch kimarite by ID
  static async fetchKimariteById(id: number): Promise<KimariiteData | null> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/kimarite/${id}`);
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

  // Fetch banzuke (rankings) for a specific basho
  static async fetchBanzuke(bashoId: number): Promise<BanzukeData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/basho/${bashoId}/banzuke`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<BanzukeData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error(`Error fetching banzuke for basho ${bashoId}:`, error);
      throw new Error('Failed to fetch banzuke data from Sumo API');
    }
  }

  // Fetch all banzuke data
  static async fetchAllBanzuke(): Promise<BanzukeData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/banzuke`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<BanzukeData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('Error fetching all banzuke data:', error);
      throw new Error('Failed to fetch banzuke data from Sumo API');
    }
  }

  // Fetch torikumi (matches) for a specific basho
  static async fetchTorikumi(bashoId: number): Promise<TorikumiData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/basho/${bashoId}/torikumi`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<TorikumiData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error(`Error fetching torikumi for basho ${bashoId}:`, error);
      throw new Error('Failed to fetch torikumi data from Sumo API');
    }
  }

  // Fetch torikumi for a specific basho and day
  static async fetchTorikumiByDay(bashoId: number, day: number): Promise<TorikumiData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/basho/${bashoId}/torikumi?day=${day}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<TorikumiData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error(`Error fetching torikumi for basho ${bashoId}, day ${day}:`, error);
      throw new Error('Failed to fetch torikumi data from Sumo API');
    }
  }

  // Fetch matches for a specific rikishi
  static async fetchRikishiMatches(rikishiId: number): Promise<RikishiMatchData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/rikishi/${rikishiId}/matches`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<RikishiMatchData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error(`Error fetching matches for rikishi ${rikishiId}:`, error);
      return []; // Return empty array instead of throwing to allow continued processing
    }
  }

  // Fetch all available rikishi match data by getting matches for multiple rikishi
  static async fetchAllRikishiMatches(rikishiIds?: number[]): Promise<RikishiMatchData[]> {
    try {
      // If no specific rikishi IDs provided, we can't fetch all matches since there's no global endpoint
      if (!rikishiIds || rikishiIds.length === 0) {
        console.warn('No global torikumi endpoint available. Need specific rikishi IDs to fetch matches.');
        return [];
      }

      console.log(`Fetching matches for ${rikishiIds.length} rikishi...`);
      const allMatches: RikishiMatchData[] = [];
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
      const response = await fetch(`${SUMO_API_BASE_URL}/rikishi/${rikishiId}/stats`);
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
      return await this.fetchBanzuke(currentBasho.id);
    } catch (error) {
      console.error('Error fetching current banzuke:', error);
      throw error;
    }
  }

  // Fetch all kimarite (winning techniques) from the API
  static async fetchKimarite(sortBy: 'count' | 'kimarite' | 'lastusage' = 'count'): Promise<KimariiteData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/kimarite/${sortBy}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SumoApiResponse<KimariiteData> = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('Error fetching kimarite data:', error);
      throw new Error('Failed to fetch kimarite data from Sumo API');
    }
  }

  // Fetch a specific kimarite by name
  static async fetchKimariiteByName(kimariiteName: string): Promise<KimariiteData | null> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/kimarite/${encodeURIComponent(kimariiteName)}`);
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

    kimariiteList.forEach((kimarite, index) => {
      try {
        const entity = mapKimariiteToEntity(kimarite, totalCount);
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
      const response = await fetch(`${SUMO_API_BASE_URL}/measurements?rikishiId=${rikishiId}`);

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
    const allMeasurements: MeasurementEntity[] = [];
    const errors: string[] = [];

    for (const rikishiId of rikishiIds) {
      try {
        const measurements = await this.fetchMeasurements(rikishiId);

        // Convert to entities
        measurements.forEach(measurement => {
          try {
            const entity = mapMeasurementToEntity(measurement);
            allMeasurements.push(entity);
          } catch (error) {
            errors.push(`Failed to convert measurement ${measurement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Failed to fetch measurements for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

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
        const entity = mapMeasurementToEntity(measurement, rikishiName);
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
      const response = await fetch(`${SUMO_API_BASE_URL}/ranks?rikishiId=${rikishiId}`);

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
    const allRanks: RankEntity[] = [];
    const errors: string[] = [];

    for (const rikishiId of rikishiIds) {
      try {
        const ranks = await this.fetchRanks(rikishiId);

        // Convert to entities
        ranks.forEach(rank => {
          try {
            const entity = mapRankToEntity(rank);
            allRanks.push(entity);
          } catch (error) {
            errors.push(`Failed to convert rank ${rank.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Failed to fetch ranks for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Errors fetching rank data:', errors);
    }

    return allRanks;
  }

  // Convert RankData array to RankEntity array
  static convertRanksToEntities(rankList: RankData[], rikishiMap?: Map<number, string>): RankEntity[] {
    const entities: RankEntity[] = [];
    const errors: string[] = [];

    rankList.forEach((rank, index) => {
      try {
        const rikishiName = rikishiMap?.get(rank.rikishiId);
        const entity = mapRankToEntity(rank, rikishiName);
        entities.push(entity);
      } catch (error) {
        errors.push(`Failed to convert rank at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Errors converting rank data:', errors);
    }

    return entities;
  }

  // Fetch shikonas (fighting names) for a specific rikishi
  static async fetchShikonas(rikishiId: number): Promise<ShikonaData[]> {
    try {
      const response = await fetch(`${SUMO_API_BASE_URL}/shikonas?rikishiId=${rikishiId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch shikonas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns an array directly for shikonas
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching shikonas:', error);
      throw error;
    }
  }

  // Fetch shikonas for multiple rikishi
  static async fetchAllShikonas(rikishiIds: number[]): Promise<ShikonaEntity[]> {
    const allShikonas: ShikonaEntity[] = [];
    const errors: string[] = [];

    for (const rikishiId of rikishiIds) {
      try {
        const shikonas = await this.fetchShikonas(rikishiId);

        // Convert to entities
        shikonas.forEach(shikona => {
          try {
            const entity = mapShikonaToEntity(shikona);
            allShikonas.push(entity);
          } catch (error) {
            errors.push(`Failed to convert shikona ${shikona.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Failed to fetch shikonas for rikishi ${rikishiId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Errors fetching shikona data:', errors);
    }

    return allShikonas;
  }

  // Fetch all banzuke data and convert to entities
  static async fetchAllBanzukeEntities(): Promise<BanzukeEntity[]> {
    const allBanzuke: BanzukeEntity[] = [];
    const errors: string[] = [];

    try {
      const banzukeData = await this.fetchAllBanzuke();

      // Convert to entities
      banzukeData.forEach(banzuke => {
        try {
          const entity = mapBanzukeToEntity(banzuke);
          allBanzuke.push(entity);
        } catch (error) {
          errors.push(`Failed to convert banzuke ${banzuke.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (errors.length > 0) {
        console.warn('Banzuke conversion errors:', errors);
      }

    } catch (error) {
      console.error(`Failed to fetch banzuke data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return allBanzuke;
  }

  // Fetch all torikumi data and convert to entities
  static async fetchAllTorikumiEntities(bashoIds?: number[]): Promise<TorikumiEntity[]> {
    const allTorikumi: TorikumiEntity[] = [];
    const errors: string[] = [];

    try {
      let torikumiData: TorikumiData[] = [];

      if (bashoIds && bashoIds.length > 0) {
        // Fetch torikumi for specific basho
        for (const bashoId of bashoIds) {
          try {
            const bashoTorikumi = await this.fetchTorikumi(bashoId);
            torikumiData.push(...bashoTorikumi);

            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            errors.push(`Failed to fetch torikumi for basho ${bashoId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        // If no specific basho IDs provided, try to get current basho torikumi
        try {
          const currentBasho = await this.fetchCurrentBasho();
          if (currentBasho) {
            torikumiData = await this.fetchTorikumi(currentBasho.id);
          }
        } catch (error) {
          console.log('No current basho available for torikumi fetch');
        }
      }

      // Get rikishi names for better display
      const rikishiList = await this.fetchRikishi();
      const rikishiMap = new Map(rikishiList.map(r => [r.id, r.shikonaEn]));

      // Convert to entities
      torikumiData.forEach(torikumi => {
        try {
          const entity = mapTorikumiToEntity(torikumi, rikishiMap);
          allTorikumi.push(entity);
        } catch (error) {
          errors.push(`Failed to convert torikumi ${torikumi.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (errors.length > 0) {
        console.warn('Torikumi conversion errors:', errors);
      }

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
        const entity = mapShikonaToEntity(shikona, rikishiName);
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
}