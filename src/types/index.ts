export interface Rikishi {
  id: string;
  name: string;
  rank: SumoRank;
  stable: string;
  weight: number;
  height: number;
  birthDate: string;
  debut: string;
  wins: number;
  losses: number;
  draws: number;
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

// Sumo API related types
export interface BashoData {
  id: number;
  name: string;
  year: number;
  month: number;
  venue: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
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
}

export interface BanzukeData {
  id: number;
  bashoId: number;
  rikishiId: number;
  rank: string;
  side: 'East' | 'West';
  division: string;
}

// Internal Banzuke entity for state management
export interface BanzukeEntity {
  id: string;
  bashoId: string;
  rikishiId: string;
  rikishiName?: string; // Optional field for display purposes
  rank: string;
  side: 'East' | 'West';
  division: string;
  date?: string; // Optional field derived from basho
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
}

export interface TorikumiData {
  id: number;
  bashoId: number;
  day: number;
  division: string;
  rikishi1Id: number;
  rikishi2Id: number;
  winnerId?: number;
  kimarite?: string;
  time?: string;
  isDecided: boolean;
}

// Internal Torikumi entity for state management
export interface TorikumiEntity {
  id: string;
  bashoId: string;
  day: number;
  division: string;
  rikishi1Id: string;
  rikishi1Name?: string; // Optional field for display purposes
  rikishi2Id: string;
  rikishi2Name?: string; // Optional field for display purposes
  winnerId?: string;
  winnerName?: string; // Optional field for display purposes
  kimarite?: string;
  time?: string;
  isDecided: boolean;
  date?: string; // Optional field derived from basho
  year?: number; // Extracted year from bashoId
  month?: number; // Extracted month from bashoId
  matchNumber?: number; // Optional match number for ordering
}

// Actual API response format for rikishi matches
export interface RikishiMatchData {
  bashoId: string;
  division: string;
  day: number;
  matchNo: number;
  eastId: number;
  eastShikona: string;
  eastRank: string;
  westId: number;
  westShikona: string;
  westRank: string;
  kimarite: string;
  winnerId: number;
  winnerEn: string;
  winnerJp: string;
}

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
}

// Shikonas API related types
export interface ShikonaData {
  id: string;
  bashoId: string;
  rikishiId: number;
  shikonaEn: string;
  shikonaJp: string;
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
}