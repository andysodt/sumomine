// API response interface for rikishi data from sumo-api.com
export interface RikishiData {
  id: number;
  sumodbId?: number;
  nskId?: number;
  shikonaEn?: string;
  shikonaJp?: string;
  currentRank?: string;
  heya?: string;
  birthDate?: string;
  shusshin?: string;
  height?: number;
  weight?: number;
  debut?: string;
  updatedAt?: string;
}

// Internal Rikishi interface for state management
export interface Rikishi {
  id: string;
  name: string;
  shikonaEn?: string;
  shikonaJp?: string;
  rank: SumoRank;
  stable: string;
  weight: number;
  height: number;
  birthDate: string;
  debut: string;
  wins: number;
  losses: number;
  draws: number;
  // New fields from API
  sumodbId?: number;
  nskId?: number;
  currentRank?: string;
  heya?: string;
  shusshin?: string; // Birthplace/hometown
  updatedAt?: string;
}

export type SumoRank =
  | 'Yokozuna'
  | 'Ozeki'
  | 'Sekiwake'
  | 'Komusubi'
  | 'Maegashira'
  | 'Juryo'
  | 'Makushita'
  | 'Sandanme'
  | 'Jonidan'
  | 'Jonokuchi';

export interface Basho {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  division: Division;
  participants: string[]; // rikishi IDs
  bouts: Bout[];
  // Enhanced fields from API
  date?: string; // Tournament year and month (e.g., "202409")
  location?: string; // Venue of the tournament
  yusho?: YushoWinner[]; // List of division champions
  specialPrizes?: SpecialPrize[]; // Awards given to wrestlers
}

// Keep Tournament as alias for backward compatibility
export type Tournament = Basho;

// Keep Match as alias for backward compatibility
export type Match = Bout;

export type Division =
  | 'Makuuchi'
  | 'Juryo'
  | 'Makushita'
  | 'Sandanme'
  | 'Jonidan'
  | 'Jonokuchi';

export interface Bout {
  id: string;
  bashoId: string;
  rikishi1Id: string;
  rikishi2Id: string;
  winnerId: string | null;
  kimarite: Kimarite | null;
  date: string;
  day: number;
  // Enhanced fields from API
  division?: string;
  matchNo?: number;
  eastId?: number;
  eastShikona?: string;
  eastRank?: string;
  westId?: number;
  westShikona?: string;
  westRank?: string;
  winnerEn?: string;
  winnerJp?: string;
}

export type Kimarite =
  | 'Yorikiri' // Force out
  | 'Oshidashi' // Push out
  | 'Hatakikomi' // Slap down
  | 'Tsukiotoshi' // Thrust down
  | 'Uwatenage' // Overarm throw
  | 'Shitatenage' // Underarm throw
  | 'Okuridashi' // Rear push out
  | 'Okuritaoshi' // Rear push down
  | 'Yoritaoshi' // Force down
  | 'Sukuinage' // Scoop throw
  | 'Kotenage' // Arm throw
  | 'Koshinage' // Hip throw
  | 'Utchari' // Backward pivot throw
  | 'Kakenage' // Hook throw
  | 'Tsuridashi' // Lift out
  | 'Tsuriotoshi' // Lift down
  | 'Abisetaoshi' // Backward force down
  | 'Makiotoshi' // Wrap around force down
  | 'Kimetaoshi' // Frontal force down
  | 'Gasshohineri' // Clasped hand twist down
  | 'Tottari' // Arm bar throw
  | 'Sakatottari' // Reverse arm bar throw
  | 'Watashikomi' // Thigh grabbing push down
  | 'Ashitori' // Leg grab
  | 'Kekaeshi' // Leg trip
  | 'Ketaguri' // Ankle sweep
  | 'Sototasukizori' // Outer leg sweep
  | 'Uchitasukizori' // Inner leg sweep
  | 'Kawazugake' // Leg entanglement
  | 'Chongake' // Leg hook
  | 'Zubuneri' // Head twist down
  | 'Kainahineri' // Arm twist down
  | 'Ipponzeoi' // One arm shoulder throw
  | 'Nichonage' // Two handed throw
  | 'Kubinage' // Neck throw
  | 'Yaguranage' // Wheel throw
  | 'Tokkyurinaoshi' // Oops, wait! (False start)
  | 'Fusen' // Forfeit
  | 'Hansoku' // Disqualification;

export interface RikishiStats {
  rikishiId: string;
  totalBouts: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  favoriteKimarite: Kimarite | null;
  recentForm: ('W' | 'L' | 'D')[];
}

export interface BashoStanding {
  rikishiId: string;
  wins: number;
  losses: number;
  rank: number;
}

// Keep TournamentStanding as alias for backward compatibility
export type TournamentStanding = BashoStanding;

// Keep old interface names as aliases for backward compatibility
export interface RikishiMatchStats {
  rikishiId: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  favoriteKimarite: Kimarite | null;
  recentForm: ('W' | 'L' | 'D')[];
}

// Enhanced API response interface for basho data from sumo-api.com
export interface BashoData {
  id: string | number; // Tournament identifier
  date: string; // Tournament year and month (e.g., "202409")
  location: string; // Venue of the tournament
  startDate: string; // ISO 8601 timestamp
  endDate: string; // ISO 8601 timestamp
  yusho: YushoWinner[]; // List of division champions
  specialPrizes: SpecialPrize[]; // Awards given to wrestlers
  year: number; // Tournament year
  month: number; // Tournament month
  name: string; // Tournament name
}

// Yusho winner interface
export interface YushoWinner {
  type: string; // Division name (e.g., "Makuuchi", "Juryo")
  rikishiId: number; // Unique wrestler identifier
  shikonaEn: string; // Wrestler's name in English
  shikonaJp: string; // Wrestler's name in Japanese
}

// Special prize interface
export interface SpecialPrize {
  type: string; // Prize name (e.g., "Shukun-sho", "Kanto-sho", "Gino-sho")
  rikishiId: number; // Unique wrestler identifier
  shikonaEn: string; // Wrestler's name in English
  shikonaJp: string; // Wrestler's name in Japanese
}

export interface KimariiteData {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  description?: string;
  count: number;
  lastUsed?: string;
}

// Internal Kimarite entity for state management
export interface KimariiteEntity {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  count: number;
  lastUsed: string | null;
  percentage?: number; // Calculated field for usage percentage
  // Enhanced calculated fields
  rank?: number; // Rank by usage count
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Extremely Rare'; // Based on usage frequency
  effectiveness?: 'High' | 'Medium' | 'Low'; // Based on usage trends
  popularityTrend?: 'Rising' | 'Stable' | 'Declining'; // Trend analysis
  lastUsedDaysAgo?: number; // Days since last used
}

// Match record structure from banzuke API
export interface BanzukeMatchRecord {
  result: 'win' | 'loss' | 'absent' | 'draw';
  opponentShikonaEn: string;
  opponentShikonaJp: string;
  opponentID: number;
  kimarite: string;
}

// Actual API response structure for banzuke data
export interface BanzukeData {
  side: 'East' | 'West';
  rikishiID: number;
  shikonaEn: string;
  rankValue: number;
  rank: string;
  record: BanzukeMatchRecord[];
  wins: number;
  losses: number;
  absences: number;
}

// Internal Banzuke entity for state management (enhanced with API data)
export interface BanzukeEntity {
  id: string;
  bashoId: string;
  rikishiId: string;
  rikishiName: string; // shikonaEn from API
  rank: string;
  rankValue: number; // Numerical rank value from API
  side: 'East' | 'West';
  division: string;
  wins: number; // Tournament wins from API
  losses: number; // Tournament losses from API
  absences: number; // Tournament absences from API
  record: BanzukeMatchRecord[]; // Complete match record from API
  date?: string; // Optional field derived from basho
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
  // Enhanced calculated fields
  winRate?: number; // Calculated win percentage
  totalMatches?: number; // Total matches (wins + losses)
  performance?: 'Excellent' | 'Good' | 'Average' | 'Poor'; // Performance classification
  rankingTrend?: 'Promoted' | 'Stable' | 'Demoted'; // Ranking movement
  strengthOfSchedule?: number; // Difficulty of opponents
  kimariiteStats?: { [technique: string]: number }; // Techniques used
  opponentQuality?: 'Elite' | 'Strong' | 'Average' | 'Weak'; // Quality of opponents faced
  consistencyRating?: number; // How consistent the performance was
  clutchPerformance?: 'Clutch' | 'Regular' | 'Poor'; // Performance in important matches
  seasonName?: string; // Tournament season name
}

// Actual API response structure for torikumi/match data (from rikishi matches endpoint)
export interface TorikumiData {
  id: string;           // Match identifier
  bashoId: string;      // Tournament identifier (e.g., "202409")
  division: string;     // Sumo division (e.g., "Makuuchi")
  day: number;          // Day of the tournament (1-15/16)
  matchNo: number;      // Match number on that day
  eastId: number;       // Eastern side wrestler ID
  eastShikona: string;  // Eastern side wrestler name
  eastRank: string;     // Eastern side wrestler rank
  westId: number;       // Western side wrestler ID
  westShikona: string;  // Western side wrestler name
  westRank: string;     // Western side wrestler rank
  kimarite: string;     // Winning technique
  winnerId: number;     // ID of the winning wrestler
  winnerEn: string;     // Winner's name in English
  winnerJp: string;     // Winner's name in Japanese
  rikishi1Id: string;   // First wrestler ID (for backward compatibility)
  rikishi2Id: string;   // Second wrestler ID (for backward compatibility)
}

// Internal Torikumi entity for state management (enhanced with API data)
export interface TorikumiEntity {
  id: string;
  bashoId: string;
  day: number;
  division: string;
  matchNo: number;        // Match number from API
  eastId: string;         // Eastern side wrestler ID
  eastShikona: string;    // Eastern side wrestler name
  eastRank: string;       // Eastern side wrestler rank
  westId: string;         // Western side wrestler ID
  westShikona: string;    // Western side wrestler name
  westRank: string;       // Western side wrestler rank
  kimarite: string;       // Winning technique
  winnerId: string;       // ID of the winning wrestler
  winnerEn: string;       // Winner's name in English
  winnerJp: string;       // Winner's name in Japanese
  date?: string;          // Optional field derived from basho
  year?: number;          // Extracted year from bashoId
  month?: number;         // Extracted month from bashoId
  // Enhanced calculated fields
  seasonName?: string;    // Tournament season name
  matchType?: 'Regular' | 'Senshuraku' | 'Playoff' | 'Special';  // Match classification
  rankDifference?: number;  // Numerical difference between opponent ranks
  upsetProbability?: 'Expected' | 'Minor Upset' | 'Major Upset' | 'Shocking'; // Upset classification
  matchImportance?: 'High' | 'Medium' | 'Low';  // Importance based on day and ranks
  technique?: {
    category: string;     // Kimarite category
    frequency: number;    // How common this technique is
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';  // Technique difficulty
  };
  rivalryMatch?: boolean;  // Whether this is a known rivalry
  streakImpact?: {
    eastStreak?: number;   // East wrestler's current streak before this match
    westStreak?: number;   // West wrestler's current streak before this match
    streakBroken?: boolean; // Whether a significant streak was broken
  };
  tournamentContext?: {
    eastRecord?: string;   // East wrestler's record going into this match
    westRecord?: string;   // West wrestler's record going into this match
    championshipImplications?: boolean; // Whether match affects championship race
  };

  // Legacy fields for backward compatibility
  rikishi1Id?: string;
  rikishi1Name?: string;
  rikishi2Id?: string;
  rikishi2Name?: string;
  winnerName?: string;
  time?: string;
  isDecided?: boolean;
  matchNumber?: number;
}

// Keep RikishiMatchData as alias for backward compatibility
export type RikishiMatchData = TorikumiData;

export interface RikishiStatsData {
  rikishiId: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  bashoCount: number;
  highestRank: string;
  currentStreak: number;
  longestStreak: number;
}

export interface SumoApiResponse<T> {
  total: number;
  records: T[];
}

// Measurements API related types
export interface MeasurementData {
  id: string;
  bashoId: string;
  rikishiId: number;
  height: number;
  weight: number;
}

// Internal Measurement entity for state management
export interface MeasurementEntity {
  id: string;
  bashoId: string;
  rikishiId: string;
  rikishiName?: string; // Optional field for display purposes
  height: number;
  weight: number;
  date?: string; // Optional field derived from basho
  bmi?: number; // Calculated field
  // Enhanced calculated fields
  bmiCategory?: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'Sumo Elite'; // BMI classification
  heightPercentile?: number; // Percentile among all rikishi
  weightPercentile?: number; // Percentile among all rikishi
  powerIndex?: number; // Combined metric of height and weight
  weightHeightRatio?: number; // Weight to height ratio
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
  seasonName?: string; // Tournament season name
  comparisonToAverage?: {
    heightDiff: number; // Difference from average height
    weightDiff: number; // Difference from average weight
    bmiDiff: number; // Difference from average BMI
  };
  trend?: 'Gaining' | 'Stable' | 'Losing'; // Weight trend analysis
}

// Ranks API related types
export interface RankData {
  id: string;
  bashoId: string;
  rikishiId: number;
  rankValue: number;
  rank: string;
}

// Internal Rank entity for state management
export interface RankEntity {
  id: string;
  bashoId: string;
  rikishiId: string;
  rikishiName?: string; // Optional field for display purposes
  rankValue: number;
  rank: string;
  date?: string; // Optional field derived from basho
  division?: string; // Extracted from rank string
  rankNumber?: number; // Extracted rank number (e.g., 1, 2, 3)
  side?: 'East' | 'West'; // Extracted side from rank
  // Enhanced calculated fields
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
  seasonName?: string; // Tournament season name
  divisionLevel?: number; // Numerical level of division (1 for Makuuchi, 2 for Juryo, etc.)
  prestige?: 'Elite' | 'Professional' | 'Amateur' | 'Beginner'; // Career level classification
  rankPercentile?: number; // Percentile position within division
  isPromoted?: boolean; // Calculated promotion status
  isDemoted?: boolean; // Calculated demotion status
  isStable?: boolean; // Stable rank status
  rankingTrend?: 'Rising' | 'Stable' | 'Declining'; // Overall trend
  divisionPosition?: 'Top' | 'Middle' | 'Bottom'; // Position within division
  eastWestAdvantage?: 'East' | 'West' | 'Neutral'; // East/West positioning advantage
  rankingScore?: number; // Overall ranking score for comparison
  nextRankTarget?: string; // Next possible promotion target
}

// Shikonas API related types (actual API response structure)
export interface ShikonaData {
  id: string;          // Format: "YYYYMM-rikishiId" (e.g., "202305-1")
  bashoId: string;     // Tournament ID (e.g., "202305")
  rikishiId: number;   // Numeric wrestler ID
  shikonaEn: string;   // English ring name
  shikonaJp: string;   // Japanese ring name (can be empty)
}

// Internal Shikona entity for state management
export interface ShikonaEntity {
  id: string;
  bashoId: string;
  rikishiId: string;
  rikishiName?: string; // Optional field for display purposes
  shikonaEn: string;
  shikonaJp: string;
  date?: string; // Optional field derived from basho
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
  // Enhanced calculated fields
  seasonName?: string; // Tournament season name
  nameType?: 'Both' | 'English Only' | 'Japanese Only' | 'Neither'; // Available name types
  nameLength?: {
    english: number;
    japanese: number;
    total: number;
  };
  hasKanji?: boolean; // Whether Japanese name contains kanji characters
  hasHiragana?: boolean; // Whether Japanese name contains hiragana characters
  hasKatakana?: boolean; // Whether Japanese name contains katakana characters
  nameComplexity?: 'Simple' | 'Moderate' | 'Complex'; // Name complexity based on character count
  nameOrigin?: 'Traditional Japanese' | 'Modern Japanese' | 'Foreign' | 'Mixed'; // Estimated name origin
  isCurrentName?: boolean; // Whether this is the most recent name
  nameChangeNumber?: number; // Sequential number if wrestler has multiple names
  nameHistory?: {
    isFirst: boolean;
    isLatest: boolean;
    totalNames: number;
  };
  namePopularity?: 'Unique' | 'Uncommon' | 'Common' | 'Very Common'; // Popularity among all shikonas
  yearsSinceUsed?: number; // Years since this name was last used
  nameTrend?: 'Historic' | 'Recent' | 'Current'; // When this name was used
  displayPreference?: 'English' | 'Japanese' | 'Both'; // Preferred display format
}