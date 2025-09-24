import React, { useState, useEffect } from 'react';
import {
  Database,
  Users,
  Trophy,
  Swords,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Info,
  Target,
  Ruler,
  Award
} from 'lucide-react';
import { ComprehensiveImportService } from '../services/comprehensiveImport';
import type { ImportOptions, ImportStats } from '../services/comprehensiveImport';
import { useLanguage } from '../context/LanguageContext';
import { useSumo } from '../context/SumoContext';
import { SumoApiService, mapRikishiMatchToBout, mapKimariiteToEntity, mapShikonaToEntity, mapBanzukeToEntity, mapTorikumiToEntity } from '../services/sumoApi';

interface ComprehensiveImportProps {
  onImportComplete?: (stats: ImportStats) => void;
}

export function ComprehensiveImport({ onImportComplete }: ComprehensiveImportProps) {
  const { } = useLanguage();
  const { state, addRikishi, addBasho, addBout, loadKimarite, loadMeasurements, loadRanks, loadShikonas, loadBanzuke, loadTorikumi } = useSumo();
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ step: '', percentage: 0 });
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [apiSummary, setApiSummary] = useState<{
    availableRikishi: number;
    availableFeatures: string[];
    apiStatus: 'online' | 'offline' | 'limited';
  } | null>(null);

  const [importOptions, setImportOptions] = useState<ImportOptions>({
    includeRikishi: true,
    includeInactiveRikishi: true, // Include all rikishi by default
    includeBasho: true,
    includeBouts: true,
    includeKimarite: true,
    includeMeasurements: true,
    includeRanks: true,
    includeShikonas: true,
    includeBanzuke: true,
    includeTorikumi: true,
    includeHistoricalData: false,
  });

  // Load API summary when component mounts
  useEffect(() => {
    loadApiSummary();
  }, []);

  const loadApiSummary = async () => {
    try {
      const summary = await ComprehensiveImportService.getDataSummary();
      setApiSummary(summary);
    } catch (error) {
      console.error('Failed to load API summary:', error);
      setApiSummary({
        availableRikishi: 0,
        availableFeatures: [],
        apiStatus: 'offline'
      });
    }
  };

  const handleComprehensiveImport = async () => {
    if (!window.confirm('This will import all 9,101 rikishi (including inactive and historical rikishi) from the Sumo API. Continue?')) {
      return;
    }

    setIsImporting(true);
    setImportProgress({ step: 'Initializing...', percentage: 0 });
    setImportStats(null);
    setIsOpen(false);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      setImportStats({
        rikishi: 0,
        basho: 0,
        bouts: 0,
        kimarite: 0,
        measurements: 0,
        ranks: 0,
        shikonas: 0,
        banzuke: 0,
        torikumi: 0,
        errors: ['Import timed out after 2 minutes. Please try again.']
      });
      setIsImporting(false);
    }, 120000); // 2 minutes timeout

    try {
      setImportProgress({ step: 'Connecting to Sumo API...', percentage: 10 });

      // Test API connectivity first
      try {
        const testResponse = await fetch('/api/sumo/rikishis?limit=1');
        if (!testResponse.ok) {
          throw new Error(`API returned ${testResponse.status}: ${testResponse.statusText}`);
        }
      } catch (error) {
        throw new Error(`Cannot connect to Sumo API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      setImportProgress({ step: 'Fetching rikishi from API...', percentage: 20 });

      // Get all rikishi
      const allRikishi = await SumoApiService.fetchRikishi();

      if (!allRikishi || allRikishi.length === 0) {
        throw new Error('No rikishi data received from API');
      }

      setImportProgress({ step: 'Processing rikishi data...', percentage: 50 });

      // Convert to internal format
      const rikishi = SumoApiService.convertToRikishi(allRikishi);

      if (!rikishi || rikishi.length === 0) {
        throw new Error('Failed to convert rikishi data');
      }
      setImportProgress({ step: 'Filtering duplicates...', percentage: 60 });

      // Filter out duplicates based on ID
      const existingRikishi = state.rikishi;
      const newRikishi = rikishi.filter(r =>
        !existingRikishi.some(existing => existing.id === r.id)
      );

      setImportProgress({ step: 'Adding rikishi to database...', percentage: 80 });

      // Add new rikishi to the system in batches to avoid overwhelming React
      let addedCount = 0;
      let skippedCount = rikishi.length - newRikishi.length;
      const batchSize = 100; // Process in batches of 100
      const errors: string[] = [];

      try {
        for (let i = 0; i < newRikishi.length; i += batchSize) {
          const batch = newRikishi.slice(i, i + batchSize);
          const batchProgress = 80 + (i / newRikishi.length) * 15; // 80-95% for adding rikishi

          setImportProgress({
            step: `Adding rikishi ${i + 1}-${Math.min(i + batch.length, newRikishi.length)} of ${newRikishi.length}...`,
            percentage: Math.round(batchProgress)
          });

          // Add batch with small delay to prevent UI blocking
          batch.forEach(r => {
            try {
              addRikishi(r);
              addedCount++;
            } catch (error) {
              console.error(`Failed to add rikishi ${r.name}:`, error);
              errors.push(`Failed to add ${r.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });

          // Small delay between batches to keep UI responsive
          if (i + batchSize < newRikishi.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      } catch (error) {
        console.error('Error during batch processing:', error);
        errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 4: Import basho if enabled
      let bashoCount = 0;
      if (importOptions.includeBasho) {
        setImportProgress({ step: 'Importing basho...', percentage: 95 });

        try {
          // Try to fetch basho data from the API
          const bashoData = await SumoApiService.fetchBashos();

          if (bashoData && bashoData.length > 0) {
            for (const basho of bashoData) {
              try {
                const convertedBasho = SumoApiService.convertBashoToBasho(basho);
                addBasho(convertedBasho);
                bashoCount++;
              } catch (error) {
                errors.push(`Failed to import basho ${basho.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } else {
            // Generate default basho if no API data
            const currentYear = new Date().getFullYear();
            const bashoSchedule = [
              { month: 1, name: 'Hatsu Basho', venue: 'Tokyo' },
              { month: 3, name: 'Haru Basho', venue: 'Osaka' },
              { month: 5, name: 'Natsu Basho', venue: 'Tokyo' },
              { month: 7, name: 'Nagoya Basho', venue: 'Nagoya' },
              { month: 9, name: 'Aki Basho', venue: 'Tokyo' },
              { month: 11, name: 'Kyushu Basho', venue: 'Fukuoka' }
            ];

            bashoSchedule.forEach((basho) => {
              const bashoItem = {
                id: `generated-basho-${currentYear}-${basho.month}`,
                name: `${basho.name} ${currentYear}`,
                startDate: `${currentYear}-${basho.month.toString().padStart(2, '0')}-01`,
                endDate: `${currentYear}-${basho.month.toString().padStart(2, '0')}-15`,
                division: 'Makuuchi' as const,
                participants: [],
                bouts: []
              };
              addBasho(bashoItem);
              bashoCount++;
            });
          }
        } catch (error) {
          errors.push(`Basho import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 3: Import Kimarite (if requested)
      let kimariiteCount = 0;
      if (importOptions.includeKimarite) {
        setImportProgress({ step: 'Importing kimarite data...', percentage: 85 });
        try {
          const kimariiteData = await SumoApiService.fetchKimarite();
          const kimariiteEntities = kimariiteData.map(k => mapKimariiteToEntity(k));
          loadKimarite(kimariiteEntities);
          kimariiteCount = kimariiteEntities.length;
        } catch (error) {
          errors.push(`Kimarite import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 4: Import Measurements (if requested)
      let measurementsCount = 0;
      if (importOptions.includeMeasurements) {
        setImportProgress({ step: 'Importing measurements data...', percentage: 88 });
        try {
          // Get active rikishi IDs for measurement import
          const activeRikishi = await SumoApiService.fetchActiveRikishi();
          const rikishiIds = activeRikishi.slice(0, 20).map(r => r.id); // Limit to 20 for demo
          const measurements = await SumoApiService.fetchAllMeasurements(rikishiIds);
          loadMeasurements(measurements);
          measurementsCount = measurements.length;
        } catch (error) {
          errors.push(`Measurements import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 5: Import Ranks (if requested)
      let ranksCount = 0;
      if (importOptions.includeRanks) {
        setImportProgress({ step: 'Importing ranks data...', percentage: 90 });
        try {
          // Get active rikishi IDs for ranks import
          const activeRikishi = await SumoApiService.fetchActiveRikishi();
          const rikishiIds = activeRikishi.slice(0, 20).map(r => r.id); // Limit to 20 for demo
          const ranks = await SumoApiService.fetchAllRanks(rikishiIds);
          loadRanks(ranks);
          ranksCount = ranks.length;
        } catch (error) {
          errors.push(`Ranks import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 6: Import Shikonas (if requested)
      let shikonasCount = 0;
      if (importOptions.includeShikonas) {
        setImportProgress({ step: 'Importing shikonas data...', percentage: 91 });
        try {
          // Get active rikishi IDs for shikonas import
          const activeRikishi = await SumoApiService.fetchActiveRikishi();
          const rikishiIds = activeRikishi.slice(0, 20).map(r => r.id); // Limit to 20 for demo
          const shikonas = await SumoApiService.fetchAllShikonas(rikishiIds);
          loadShikonas(shikonas);
          shikonasCount = shikonas.length;
        } catch (error) {
          errors.push(`Shikonas import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 7: Import Banzuke (if requested)
      let banzukeCount = 0;
      if (importOptions.includeBanzuke) {
        setImportProgress({ step: 'Importing banzuke data...', percentage: 92 });
        try {
          const banzuke = await SumoApiService.fetchAllBanzukeEntities();
          loadBanzuke(banzuke);
          banzukeCount = banzuke.length;
        } catch (error) {
          errors.push(`Banzuke import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 8: Import Torikumi (if requested)
      let torikumiCount = 0;
      if (importOptions.includeTorikumi) {
        setImportProgress({ step: 'Importing torikumi data...', percentage: 95 });
        try {
          // Get recent bashos for torikumi import
          const bashos = await SumoApiService.fetchBashos();
          const recentBashoIds = bashos.slice(0, 2).map(b => b.id); // Get latest 2 bashos
          const torikumi = await SumoApiService.fetchAllTorikumiEntities(recentBashoIds);
          loadTorikumi(torikumi);
          torikumiCount = torikumi.length;
        } catch (error) {
          errors.push(`Torikumi import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 9: Import Bouts (if requested)
      let boutsCount = 0;
      if (importOptions.includeBouts) {
        try {
          setImportProgress({ step: 'Importing bouts from API...', percentage: 95 });

          // Get torikumi (matches) data from the API
          // Since there's no global torikumi endpoint, we'll fetch matches for the imported rikishi
          const importedRikishiIds = state.rikishi
            .filter(r => r.id.startsWith('sumo-api-'))
            .map(r => parseInt(r.id.replace('sumo-api-', '')))
            .slice(0, 10); // Limit to 10 rikishi to avoid too many API calls

          if (importedRikishiIds.length === 0) {
            console.warn('No imported rikishi found for bout import');
            return;
          }

          const matchData = await SumoApiService.fetchAllRikishiMatches(importedRikishiIds);

          if (matchData && matchData.length > 0) {
            setImportProgress({ step: 'Converting bouts data...', percentage: 90 });

            // Convert rikishi matches to bouts and filter duplicates
            const existingBouts = state.bouts;
            const newBouts = [];

            for (const match of matchData) {
              try {
                const bout = mapRikishiMatchToBout(match);
                // Check if bout already exists
                if (!existingBouts.some(existing => existing.id === bout.id)) {
                  newBouts.push(bout);
                }
              } catch (error) {
                errors.push(`Failed to convert match ${match.bashoId}-${match.day}-${match.matchNo}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            setImportProgress({ step: 'Adding bouts to database...', percentage: 95 });

            // Add new bouts to the system
            for (const bout of newBouts) {
              addBout(bout);
              boutsCount++;
            }

            console.log(`Successfully imported ${boutsCount} new bouts`);
          } else {
            console.log('No match data found for imported rikishi');
            errors.push('No bout data available for imported rikishi - this is normal for newly created rikishi');
          }
        } catch (error) {
          errors.push(`Bouts import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportProgress({ step: 'Import complete!', percentage: 100 });

      // Compile final statistics
      const finalErrors = [...errors];
      if (skippedCount > 0) {
        finalErrors.push(`Skipped ${skippedCount} duplicate rikishi`);
      }

      const stats: ImportStats = {
        rikishi: addedCount,
        basho: bashoCount,
        bouts: boutsCount,
        kimarite: kimariiteCount,
        measurements: measurementsCount,
        ranks: ranksCount,
        shikonas: shikonasCount,
        banzuke: banzukeCount,
        torikumi: torikumiCount,
        errors: finalErrors
      };

      clearTimeout(timeout);
      setImportStats(stats);
      onImportComplete?.(stats);

    } catch (error) {
      console.error('Comprehensive import failed:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      clearTimeout(timeout);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const detailedError = error instanceof Error && error.stack
        ? `${errorMessage}\n\nStack trace:\n${error.stack}`
        : errorMessage;

      setImportStats({
        rikishi: 0,
        basho: 0,
        bouts: 0,
        kimarite: 0,
        measurements: 0,
        ranks: 0,
        shikonas: 0,
        banzuke: 0,
        torikumi: 0,
        errors: [`Import failed: ${detailedError}`]
      });
    } finally {
      clearTimeout(timeout);
      setIsImporting(false);
      setImportProgress({ step: '', percentage: 0 });
    }
  };

  const toggleOption = (option: keyof ImportOptions) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'limited': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'limited': return AlertCircle;
      case 'offline': return AlertCircle;
      default: return Info;
    }
  };

  return (
    <div className="relative">
      {/* Import Progress Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-jpblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-jpblue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Importing Data</h3>
              <p className="text-sm text-gray-600 mb-4">{importProgress.step}</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-jpblue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{importProgress.percentage}% complete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Results Toast */}
      {importStats && !isImporting && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-slide-in bg-white border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {importStats.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {importStats.errors.some(error => error.includes('Import failed')) ? 'Import Failed' : 'Import Complete'}
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Rikishi: {importStats.rikishi}</div>
                <div>Basho: {importStats.basho}</div>
                <div>Bouts: {importStats.bouts}</div>
                <div>Kimarite: {importStats.kimarite}</div>
                <div>Measurements: {importStats.measurements}</div>
                <div>Ranks: {importStats.ranks}</div>
                <div>Shikonas: {importStats.shikonas}</div>
                <div>Banzuke: {importStats.banzuke}</div>
                <div>Torikumi: {importStats.torikumi}</div>
                {importStats.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-yellow-600 font-medium">
                      {importStats.errors.length} error(s):
                    </div>
                    {importStats.errors.map((error, index) => (
                      <div key={index} className="text-red-600 text-xs font-mono bg-red-50 p-2 rounded border max-h-32 overflow-y-auto">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setImportStats(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Import Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleComprehensiveImport}
          disabled={isImporting || apiSummary?.apiStatus === 'offline'}
          className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-jpblue-600 via-jpblue-700 to-jpblue-800 text-white rounded-xl text-sm font-semibold hover:from-jpblue-700 hover:via-jpblue-800 hover:to-jpblue-900 focus:outline-none focus:ring-2 focus:ring-jpblue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-jpblue-400/20 to-jpblue-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
          <div className="relative flex items-center">
            {isImporting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Database className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            )}
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold">
              Import Everything
            </span>
            {apiSummary && apiSummary.availableRikishi > 0 && (
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                {apiSummary.availableRikishi.toLocaleString()}+ items
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isImporting}
          className="inline-flex items-center px-3 py-3 border border-jpblue-300 text-jpblue-700 bg-jpblue-50 rounded-xl text-sm font-medium hover:bg-jpblue-100 hover:border-jpblue-400 focus:outline-none focus:ring-2 focus:ring-jpblue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          title="Import Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Configuration Panel */}
      {isOpen && !isImporting && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-40 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Comprehensive Import Settings</h3>

            {/* API Status */}
            {apiSummary && (
              <div className="flex items-center space-x-2 text-xs">
                {React.createElement(getStatusIcon(apiSummary.apiStatus), {
                  className: `h-4 w-4 ${getStatusColor(apiSummary.apiStatus)}`
                })}
                <span className={getStatusColor(apiSummary.apiStatus)}>
                  API Status: {apiSummary.apiStatus}
                </span>
              </div>
            )}

            {apiSummary && apiSummary.availableRikishi > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {apiSummary.availableRikishi.toLocaleString()} rikishi available
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeRikishi}
                  onChange={() => toggleOption('includeRikishi')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Rikishi</span>
                </div>
              </label>

              {importOptions.includeRikishi && (
                <label className="flex items-center space-x-2 ml-6">
                  <input
                    type="checkbox"
                    checked={importOptions.includeInactiveRikishi}
                    onChange={() => toggleOption('includeInactiveRikishi')}
                    className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                  />
                  <span className="text-xs text-gray-600">Include inactive rikishi</span>
                </label>
              )}

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeBasho}
                  onChange={() => toggleOption('includeBasho')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Basho</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeBouts}
                  onChange={() => toggleOption('includeBouts')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Swords className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Bouts</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeKimarite}
                  onChange={() => toggleOption('includeKimarite')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Kimarite</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeMeasurements}
                  onChange={() => toggleOption('includeMeasurements')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Ruler className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Measurements</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeRanks}
                  onChange={() => toggleOption('includeRanks')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Ranks</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeShikonas}
                  onChange={() => toggleOption('includeShikonas')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Shikonas</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeBanzuke}
                  onChange={() => toggleOption('includeBanzuke')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Banzuke</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeTorikumi}
                  onChange={() => toggleOption('includeTorikumi')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <Swords className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Import Torikumi</span>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.includeHistoricalData}
                  onChange={() => toggleOption('includeHistoricalData')}
                  className="rounded border-gray-300 text-jpblue-600 focus:ring-jpblue-500"
                />
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Include Historical Data</span>
                </div>
              </label>
            </div>

            {/* Available Features */}
            {apiSummary && apiSummary.availableFeatures.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-700 mb-2">Available Features:</div>
                <div className="flex flex-wrap gap-1">
                  {apiSummary.availableFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex px-2 py-1 text-xs bg-jpblue-100 text-jpblue-700 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-start space-x-2 text-xs text-amber-600">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                This will import all 9,101 wrestlers (including inactive/historical ones) and may take several minutes to complete.
                Some features may not be available depending on API limitations.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}