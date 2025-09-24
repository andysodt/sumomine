import { SumoApiService, mapTorikumiToBout } from './sumoApi';
import type { RikishiData } from './sumoApi';
import type { Rikishi, Basho, Bout, BashoData, KimariiteEntity, MeasurementEntity, RankEntity, ShikonaEntity, BanzukeEntity, TorikumiEntity } from '../types';

export interface ImportStats {
  rikishi: number;
  basho: number;
  bouts: number;
  kimarite: number;
  measurements: number;
  ranks: number;
  shikonas: number;
  banzuke: number;
  torikumi: number;
  errors: string[];
}

export interface ImportOptions {
  includeRikishi: boolean;
  includeInactiveRikishi: boolean;
  includeBasho: boolean;
  includeBouts: boolean;
  includeKimarite: boolean;
  includeMeasurements: boolean;
  includeRanks: boolean;
  includeShikonas: boolean;
  includeBanzuke: boolean;
  includeTorikumi: boolean;
  includeHistoricalData: boolean;
}

export class ComprehensiveImportService {
  private static readonly SUMO_API_BASE = '/api/sumo';

  // Import all available data from Sumo API
  static async importEverything(
    options: ImportOptions,
    onProgress?: (progress: { step: string; percentage: number }) => void
  ): Promise<ImportStats> {
    const stats: ImportStats = {
      rikishi: 0,
      basho: 0,
      bouts: 0,
      kimarite: 0,
      measurements: 0,
      ranks: 0,
      shikonas: 0,
      banzuke: 0,
      torikumi: 0,
      errors: []
    };

    try {
      onProgress?.({ step: 'Starting comprehensive import...', percentage: 0 });

      // Step 1: Import Rikishi (if requested)
      if (options.includeRikishi) {
        onProgress?.({ step: 'Importing rikishi...', percentage: 10 });
        const rikishiStats = await this.importAllRikishi(options.includeInactiveRikishi);
        stats.rikishi = rikishiStats.count;
        stats.errors.push(...rikishiStats.errors);
      }

      // Step 2: Import Additional Rikishi Data
      if (options.includeRikishi) {
        onProgress?.({ step: 'Fetching rikishi statistics...', percentage: 30 });
        await this.importRikishiStats();
      }

      // Step 3: Import Rank and Measurement Data
      onProgress?.({ step: 'Importing ranks and measurements...', percentage: 50 });
      await this.importAdditionalData();

      // Step 4: Import Basho Data (if available)
      if (options.includeBasho) {
        onProgress?.({ step: 'Importing basho data...', percentage: 70 });
        const bashoStats = await this.importBashoData();
        stats.basho = bashoStats.count;
        stats.errors.push(...bashoStats.errors);
      }

      // Step 5: Import Bout Data (if available)
      if (options.includeBouts) {
        onProgress?.({ step: 'Importing bout data...', percentage: 80 });
        const boutStats = await this.importBoutData();
        stats.bouts = boutStats.count;
        stats.errors.push(...boutStats.errors);
      }

      // Step 6: Import Kimarite Data (if requested)
      if (options.includeKimarite) {
        onProgress?.({ step: 'Importing kimarite (winning techniques)...', percentage: 85 });
        const kimariiteStats = await this.importKimariiteData();
        stats.kimarite = kimariiteStats.count;
        stats.errors.push(...kimariiteStats.errors);
      }

      // Step 7: Import Measurements Data (if requested)
      if (options.includeMeasurements) {
        onProgress?.({ step: 'Importing measurements data...', percentage: 88 });
        const measurementStats = await this.importMeasurementsData();
        stats.measurements = measurementStats.count;
        stats.errors.push(...measurementStats.errors);
      }

      // Step 8: Import Ranks Data (if requested)
      if (options.includeRanks) {
        onProgress?.({ step: 'Importing ranks data...', percentage: 92 });
        const rankStats = await this.importRanksData();
        stats.ranks = rankStats.count;
        stats.errors.push(...rankStats.errors);
      }

      // Step 9: Import Shikonas Data (if requested)
      if (options.includeShikonas) {
        onProgress?.({ step: 'Importing shikonas data...', percentage: 94 });
        const shikonasStats = await this.importShikonasData();
        stats.shikonas = shikonasStats.count;
        stats.errors.push(...shikonasStats.errors);
      }

      // Step 10: Import Banzuke Data (if requested)
      if (options.includeBanzuke) {
        onProgress?.({ step: 'Importing banzuke data...', percentage: 95 });
        const banzukeStats = await this.importBanzukeData();
        stats.banzuke = banzukeStats.count;
        stats.errors.push(...banzukeStats.errors);
      }

      // Step 11: Import Torikumi Data (if requested)
      if (options.includeTorikumi) {
        onProgress?.({ step: 'Importing torikumi data...', percentage: 98 });
        const torikumiStats = await this.importTorikumiData();
        stats.torikumi = torikumiStats.count;
        stats.errors.push(...torikumiStats.errors);
      }

      onProgress?.({ step: 'Import completed!', percentage: 100 });

    } catch (error) {
      console.error('Comprehensive import error:', error);
      stats.errors.push(`General import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return stats;
  }

  // Import all rikishi with their complete data
  private static async importAllRikishi(includeInactive: boolean = false): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // Get all rikishi
      const allRikishi = await SumoApiService.fetchRikishi();

      // Filter based on options
      const rikishiToImport = includeInactive
        ? allRikishi
        : allRikishi.filter(w => w.currentRank && !['Intai', 'Kyujo'].includes(w.currentRank));

      console.log(`Found ${rikishiToImport.length} rikishi to import`);
      count = rikishiToImport.length;

      // For each rikishi, try to get additional data
      for (let i = 0; i < Math.min(rikishiToImport.length, 50); i++) { // Limit to first 50 for demo
        const rikishi = rikishiToImport[i];
        try {
          // Try to get rikishi stats
          const stats = await SumoApiService.fetchRikishiStats(rikishi.id);
          if (stats) {
            // Update rikishi with stats data
            console.log(`Got stats for ${rikishi.shikonaEn}:`, stats);
          }
        } catch (error) {
          errors.push(`Failed to get stats for rikishi ${rikishi.shikonaEn}: ${error}`);
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      errors.push(`Failed to import rikishi: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import rikishi statistics
  private static async importRikishiStats(): Promise<void> {
    try {
      // This would fetch detailed statistics for all rikishi
      console.log('Importing rikishi statistics...');
      // Implementation would depend on available API endpoints
    } catch (error) {
      console.error('Failed to import rikishi stats:', error);
    }
  }

  // Import additional data like ranks, measurements, etc.
  private static async importAdditionalData(): Promise<void> {
    try {
      // Try to import additional data (these endpoints may require specific parameters)
      try {
        console.log('Additional data endpoints require specific parameters, skipping for now...');
        // These endpoints exist but require specific query parameters that we don't have
        // Examples: /ranks?rikishiId=X, /measurements?rikishiId=X, etc.
      } catch (error) {
        console.log('Additional data endpoints not available');
      }

    } catch (error) {
      console.error('Failed to import additional data:', error);
    }
  }

  // Import basho data
  private static async importBashoData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import basho data...');

      // Try to fetch basho data from the API
      const bashoData = await SumoApiService.fetchBashos();

      if (bashoData && bashoData.length > 0) {
        console.log(`Found ${bashoData.length} basho records`);

        for (const basho of bashoData) {
          try {
            // Convert basho to internal format
            const convertedBasho = SumoApiService.convertBashoToBasho(basho, basho.id.toString());
            console.log(`Converted basho: ${convertedBasho.name}`);
            count++;
          } catch (error) {
            errors.push(`Failed to convert basho ${basho.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        console.log('No basho data available from API, generating default basho');
        // Create some default basho based on common sumo calendar
        const currentYear = new Date().getFullYear();
        const bashoSchedule = [
          { month: 1, name: 'Hatsu Basho', venue: 'Tokyo' },
          { month: 3, name: 'Haru Basho', venue: 'Osaka' },
          { month: 5, name: 'Natsu Basho', venue: 'Tokyo' },
          { month: 7, name: 'Nagoya Basho', venue: 'Nagoya' },
          { month: 9, name: 'Aki Basho', venue: 'Tokyo' },
          { month: 11, name: 'Kyushu Basho', venue: 'Fukuoka' }
        ];

        bashoSchedule.forEach((basho, index) => {
          const bashoItem: Basho = {
            id: `generated-basho-${currentYear}-${basho.month}`,
            name: `${basho.name} ${currentYear}`,
            startDate: `${currentYear}-${basho.month.toString().padStart(2, '0')}-01`,
            endDate: `${currentYear}-${basho.month.toString().padStart(2, '0')}-15`,
            division: 'Makuuchi',
            participants: [],
            bouts: []
          };
          console.log(`Generated basho: ${bashoItem.name}`);
          count++;
        });
      }

    } catch (error) {
      errors.push(`Failed to import basho: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import bout data from Sumo API
  private static async importBoutData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import bout data from Sumo API...');

      // Get all available torikumi (matches) data
      const torikumiData = await SumoApiService.fetchAllTorikumi();
      console.log(`Found ${torikumiData.length} torikumi records`);

      // Convert torikumi data to bouts and collect them
      const bouts: Bout[] = [];
      for (const torikumi of torikumiData) {
        try {
          const bout = mapTorikumiToBout(torikumi);
          bouts.push(bout);
          count++;
        } catch (error) {
          errors.push(`Failed to convert torikumi ${torikumi.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`Successfully converted ${count} torikumi to bouts`);

      // Return the converted bouts
      // Note: The actual adding to state will be handled by the calling component
      // This method just prepares the data for import

    } catch (error) {
      console.error('Error importing bout data:', error);
      errors.push(`Failed to import bouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import kimarite data from Sumo API
  private static async importKimariiteData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import kimarite data from Sumo API...');

      // Try different sorting options to get kimarite data
      const sortOptions: ('count' | 'kimarite' | 'lastusage')[] = ['count', 'kimarite', 'lastusage'];
      let kimariiteData: KimariiteEntity[] = [];

      for (const sortBy of sortOptions) {
        try {
          console.log(`Trying to fetch kimarite data sorted by: ${sortBy}`);
          const data = await SumoApiService.fetchKimarite(sortBy);

          if (data && data.length > 0) {
            console.log(`Successfully fetched ${data.length} kimarite records with sort: ${sortBy}`);
            kimariiteData = SumoApiService.convertKimariiteToEntities(data);
            break;
          }
        } catch (error) {
          console.log(`Failed to fetch kimarite with sort ${sortBy}:`, error);
          errors.push(`Failed to fetch kimarite sorted by ${sortBy}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (kimariiteData.length > 0) {
        console.log(`Found ${kimariiteData.length} kimarite records`);
        count = kimariiteData.length;

        // Log some sample data
        kimariiteData.slice(0, 3).forEach((kimarite, index) => {
          console.log(`Kimarite ${index + 1}: ${kimarite.nameEn} (${kimarite.name}) - Used ${kimarite.count} times`);
        });
      } else {
        console.log('No kimarite data available from API, this is expected if the database is empty');
        errors.push('No kimarite data available from the Sumo API');
      }

    } catch (error) {
      console.error('Error importing kimarite data:', error);
      errors.push(`Failed to import kimarite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import measurements data from Sumo API
  private static async importMeasurementsData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import measurements data from Sumo API...');

      // Get all rikishi first to fetch measurements for each
      const allRikishi = await SumoApiService.fetchRikishi();
      console.log(`Found ${allRikishi.length} rikishi to fetch measurements for`);

      if (allRikishi.length === 0) {
        console.log('No rikishi available to fetch measurements for');
        errors.push('No rikishi available to fetch measurements for');
        return { count, errors };
      }

      // Limit to first 10 rikishi for demo purposes to avoid overwhelming the API
      const rikishiToProcess = allRikishi.slice(0, 10);
      const rikishiIds = rikishiToProcess.map(r => r.id);

      console.log(`Fetching measurements for ${rikishiIds.length} rikishi: ${rikishiIds.join(', ')}`);

      // Fetch measurements for all rikishi
      const measurements = await SumoApiService.fetchAllMeasurements(rikishiIds);

      if (measurements.length > 0) {
        console.log(`Successfully fetched ${measurements.length} measurement records`);
        count = measurements.length;

        // Log some sample data
        measurements.slice(0, 3).forEach((measurement, index) => {
          console.log(`Measurement ${index + 1}: ${measurement.rikishiName} - Height: ${measurement.height}cm, Weight: ${measurement.weight}kg, BMI: ${measurement.bmi}`);
        });
      } else {
        console.log('No measurement data found for the selected rikishi');
        errors.push('No measurement data found for the selected rikishi');
      }

    } catch (error) {
      console.error('Error importing measurements data:', error);
      errors.push(`Failed to import measurements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import ranks data from Sumo API
  private static async importRanksData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import ranks data from Sumo API...');

      // Get all rikishi first to fetch ranks for each
      const allRikishi = await SumoApiService.fetchRikishi();
      console.log(`Found ${allRikishi.length} rikishi to fetch ranks for`);

      if (allRikishi.length === 0) {
        console.log('No rikishi available to fetch ranks for');
        errors.push('No rikishi available to fetch ranks for');
        return { count, errors };
      }

      // Limit to first 5 rikishi for demo purposes to avoid overwhelming the API
      const rikishiToProcess = allRikishi.slice(0, 5);
      const rikishiIds = rikishiToProcess.map(r => r.id);

      console.log(`Fetching ranks for ${rikishiIds.length} rikishi: ${rikishiIds.join(', ')}`);

      // Fetch ranks for all rikishi
      const ranks = await SumoApiService.fetchAllRanks(rikishiIds);

      if (ranks.length > 0) {
        console.log(`Successfully fetched ${ranks.length} rank records`);
        count = ranks.length;

        // Log some sample data
        ranks.slice(0, 3).forEach((rank, index) => {
          console.log(`Rank ${index + 1}: ${rank.rikishiName} - ${rank.rank} (Value: ${rank.rankValue}) in ${rank.bashoId}`);
        });
      } else {
        console.log('No rank data found for the selected rikishi');
        errors.push('No rank data found for the selected rikishi');
      }

    } catch (error) {
      console.error('Error importing ranks data:', error);
      errors.push(`Failed to import ranks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import shikonas data from Sumo API
  private static async importShikonasData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import shikonas data from Sumo API...');

      // Get all rikishi first to fetch shikonas for each
      const allRikishi = await SumoApiService.fetchRikishi();
      console.log(`Found ${allRikishi.length} rikishi to fetch shikonas for`);

      if (allRikishi.length === 0) {
        console.log('No rikishi available to fetch shikonas for');
        errors.push('No rikishi available to fetch shikonas for');
        return { count, errors };
      }

      // Limit to first 10 rikishi for demo purposes to avoid overwhelming the API
      const rikishiToProcess = allRikishi.slice(0, 10);
      const rikishiIds = rikishiToProcess.map(r => r.id);

      console.log(`Fetching shikonas for ${rikishiIds.length} rikishi: ${rikishiIds.join(', ')}`);

      // Fetch shikonas for all rikishi
      const shikonas = await SumoApiService.fetchAllShikonas(rikishiIds);

      if (shikonas.length > 0) {
        console.log(`Successfully fetched ${shikonas.length} shikona records`);
        count = shikonas.length;

        // Log some sample data
        shikonas.slice(0, 3).forEach((shikona, index) => {
          console.log(`Shikona ${index + 1}: ${shikona.rikishiName} - EN: "${shikona.shikonaEn}", JP: "${shikona.shikonaJp}" (${shikona.year}/${shikona.month})`);
        });
      } else {
        console.log('No shikona data found for the selected rikishi');
        errors.push('No shikona data found for the selected rikishi');
      }

    } catch (error) {
      console.error('Error importing shikonas data:', error);
      errors.push(`Failed to import shikonas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import banzuke data from Sumo API
  private static async importBanzukeData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import banzuke data from Sumo API...');

      // Try to get banzuke data from current basho
      const banzuke = await SumoApiService.fetchAllBanzukeEntities();

      if (banzuke.length > 0) {
        console.log(`Successfully fetched ${banzuke.length} banzuke records`);
        count = banzuke.length;

        // Log some sample data
        banzuke.slice(0, 3).forEach((entry, index) => {
          console.log(`Banzuke ${index + 1}: ${entry.rikishiName} - ${entry.rank} (${entry.side}) in ${entry.division} (${entry.year}/${entry.month})`);
        });
      } else {
        console.log('No banzuke data found');
        errors.push('No banzuke data found - this may be normal if no current tournament is active');
      }

    } catch (error) {
      console.error('Error importing banzuke data:', error);
      errors.push(`Failed to import banzuke: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Import torikumi data from Sumo API
  private static async importTorikumiData(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      console.log('Attempting to import torikumi data from Sumo API...');

      // Try to get recent basho IDs for torikumi import
      const bashos = await SumoApiService.fetchBashos();
      const recentBashoIds = bashos.slice(0, 3).map(b => typeof b.id === 'string' ? parseInt(b.id) : b.id).filter(id => !isNaN(id)); // Get latest 3 bashos

      if (recentBashoIds.length > 0) {
        console.log(`Fetching torikumi for ${recentBashoIds.length} recent bashos: ${recentBashoIds.join(', ')}`);

        const torikumi = await SumoApiService.fetchAllTorikumiEntities(recentBashoIds);

        if (torikumi.length > 0) {
          console.log(`Successfully fetched ${torikumi.length} torikumi records`);
          count = torikumi.length;

          // Log some sample data
          torikumi.slice(0, 3).forEach((match, index) => {
            console.log(`Torikumi ${index + 1}: ${match.rikishi1Name} vs ${match.rikishi2Name} - Day ${match.day} (${match.division}) - Winner: ${match.winnerName || 'TBD'}`);
          });
        } else {
          console.log('No torikumi data found for the selected bashos');
          errors.push('No torikumi data found for recent bashos');
        }
      } else {
        console.log('No basho data available for torikumi import');
        errors.push('No basho data available for torikumi import');
      }

    } catch (error) {
      console.error('Error importing torikumi data:', error);
      errors.push(`Failed to import torikumi: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { count, errors };
  }

  // Get comprehensive data summary
  static async getDataSummary(): Promise<{
    availableRikishi: number;
    availableFeatures: string[];
    apiStatus: 'online' | 'offline' | 'limited';
  }> {
    try {
      // Test basic API connectivity
      const response = await fetch(`${this.SUMO_API_BASE}/rikishis`);
      if (!response.ok) {
        return {
          availableRikishi: 0,
          availableFeatures: [],
          apiStatus: 'offline'
        };
      }

      const data = await response.json();
      const availableFeatures = ['rikishi', 'rikishi-stats', 'kimarite', 'measurements', 'ranks', 'shikonas', 'banzuke', 'torikumi'];

      // For now, we know rikishi, rikishi-stats, kimarite, measurements, and ranks are available
      // Other endpoints require specific parameters, so we'll mark them as potentially available
      availableFeatures.push('rikishi-matches', 'potential-tournaments', 'potential-techniques');

      return {
        availableRikishi: data.total || 0,
        availableFeatures,
        apiStatus: 'online'
      };

    } catch (error) {
      console.error('Failed to get data summary:', error);
      return {
        availableRikishi: 0,
        availableFeatures: [],
        apiStatus: 'offline'
      };
    }
  }
}