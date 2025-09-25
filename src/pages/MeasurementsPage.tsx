import { useState } from 'react';
import { Download, Search, Ruler, TrendingUp, AlertCircle, BarChart3, Award, Scale, Target, Zap } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { useLanguage } from '../context/LanguageContext';
import { SumoApiService } from '../services/sumoApi';

export function MeasurementsPage() {
  const { state, loadMeasurements } = useSumoDB();
  useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRikishi, setFilterRikishi] = useState('');
  const [sortBy, setSortBy] = useState<'height' | 'weight' | 'bmi' | 'rikishiName' | 'powerIndex' | 'heightPercentile' | 'weightPercentile' | 'bmiCategory'>('bmi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredMeasurements = state.measurements.filter(measurement => {
    const matchesSearch = measurement.rikishiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         measurement.rikishiId.includes(searchTerm) ||
                         measurement.bashoId.includes(searchTerm.toLowerCase());
    const matchesRikishi = filterRikishi === '' || measurement.rikishiId === filterRikishi;
    return matchesSearch && matchesRikishi;
  });

  const sortedMeasurements = [...filteredMeasurements].sort((a, b) => {
    switch (sortBy) {
      case 'height':
        return b.height - a.height;
      case 'weight':
        return b.weight - a.weight;
      case 'bmi':
        return (b.bmi || 0) - (a.bmi || 0);
      case 'rikishiName':
        return (a.rikishiName || '').localeCompare(b.rikishiName || '');
      case 'powerIndex':
        return (b.powerIndex || 0) - (a.powerIndex || 0);
      case 'heightPercentile':
        return (b.heightPercentile || 0) - (a.heightPercentile || 0);
      case 'weightPercentile':
        return (b.weightPercentile || 0) - (a.weightPercentile || 0);
      case 'bmiCategory': {
        const categoryOrder = { 'Sumo Elite': 5, 'Obese': 4, 'Overweight': 3, 'Normal': 2, 'Underweight': 1 };
        return (categoryOrder[b.bmiCategory || 'Normal'] || 0) - (categoryOrder[a.bmiCategory || 'Normal'] || 0);
      }
      default:
        return 0;
    }
  });

  const uniqueRikishi = Array.from(
    new Map(state.measurements.map(m => [m.rikishiId, { id: m.rikishiId, name: m.rikishiName }])).values()
  );

  const handleImportMeasurements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all rikishi first
      const allRikishi = await SumoApiService.fetchRikishi(true);

      if (allRikishi.length === 0) {
        setError('No rikishi data available. Please import rikishi data first.');
        return;
      }

      const rikishiToProcess = allRikishi;
      const rikishiIds = rikishiToProcess.map(r => r.id);

      console.log(`Fetching measurements for ${rikishiIds.length} rikishi`);

      const measurements = await SumoApiService.fetchAllMeasurements(rikishiIds);

      if (measurements.length > 0) {
        loadMeasurements(measurements);
      } else {
        setError('No measurement data found for the selected rikishi. This may be normal if measurements are not available.');
      }
    } catch (err) {
      setError(`Failed to import measurements: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const averageHeight = state.measurements.length > 0 ?
    Math.round(state.measurements.reduce((sum, m) => sum + m.height, 0) / state.measurements.length) : 0;
  const averageWeight = state.measurements.length > 0 ?
    Math.round(state.measurements.reduce((sum, m) => sum + m.weight, 0) / state.measurements.length) : 0;
  const averageBMI = state.measurements.length > 0 ?
    Math.round((state.measurements.reduce((sum, m) => sum + (m.bmi || 0), 0) / state.measurements.length) * 10) / 10 : 0;

  const getBMICategory = (bmi: number | undefined): string => {
    if (!bmi) return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (bmi: number | undefined): string => {
    if (!bmi) return 'text-gray-500';
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-jpblue-600';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Ruler className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-600 to-jpblue-700 bg-clip-text text-transparent">
                Measurements
              </h1>
              <p className="mt-2 text-gray-600">
                Height, weight, and BMI data for rikishi across different tournaments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {state.measurements.length > 0 && (
              <div className="text-sm text-gray-500">
                {state.measurements.length} records
              </div>
            )}
            <button
              onClick={handleImportMeasurements}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {isLoading ? 'Importing...' : 'Import Measurements'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Sorting */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search measurements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-jpblue-500 focus:border-jpblue-500"
            />
          </div>
          <div>
            <select
              value={filterRikishi}
              onChange={(e) => setFilterRikishi(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-jpblue-500 focus:border-jpblue-500 rounded-md"
            >
              <option value="">All Rikishi</option>
              {uniqueRikishi.map(rikishi => (
                <option key={rikishi.id} value={rikishi.id}>
                  {rikishi.name || `Rikishi ${rikishi.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'height' | 'weight' | 'bmi' | 'rikishiName' | 'powerIndex' | 'heightPercentile' | 'weightPercentile' | 'bmiCategory')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-jpblue-500 focus:border-jpblue-500 rounded-md"
            >
              <option value="bmi">Sort by BMI</option>
              <option value="height">Sort by Height</option>
              <option value="weight">Sort by Weight</option>
              <option value="powerIndex">Sort by Power Index</option>
              <option value="heightPercentile">Sort by Height Percentile</option>
              <option value="weightPercentile">Sort by Weight Percentile</option>
              <option value="bmiCategory">Sort by BMI Category</option>
              <option value="rikishiName">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {state.measurements.length > 0 && (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{state.measurements.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Height</p>
                <p className="text-2xl font-bold text-gray-900">{averageHeight} cm</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-600 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Weight</p>
                <p className="text-2xl font-bold text-gray-900">{averageWeight} kg</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg BMI</p>
                <p className="text-2xl font-bold text-gray-900">{averageBMI}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurements Grid */}
      {sortedMeasurements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedMeasurements.map((measurement, index) => (
            <div
              key={measurement.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpblue transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-3 py-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">測</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpblue-700 transition-colors">
                          {measurement.rikishiName || `Rikishi ${measurement.rikishiId}`}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-jpblue-600">{measurement.seasonName || measurement.bashoId}</p>
                          {measurement.year && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                              {measurement.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {/* Enhanced badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {measurement.bmiCategory && (
                      <div className={`flex items-center text-xs px-2 py-1 rounded-md ${
                        measurement.bmiCategory === 'Sumo Elite' ? 'text-purple-600 bg-purple-50' :
                        measurement.bmiCategory === 'Obese' ? 'text-red-600 bg-red-50' :
                        measurement.bmiCategory === 'Overweight' ? 'text-orange-600 bg-orange-50' :
                        measurement.bmiCategory === 'Normal' ? 'text-green-600 bg-green-50' :
                        'text-blue-600 bg-blue-50'
                      }`}>
                        <Award className="h-3 w-3 mr-1" />
                        {measurement.bmiCategory}
                      </div>
                    )}
                    {measurement.powerIndex && (
                      <div className="flex items-center text-xs text-jpblue-600 bg-jpblue-50 px-2 py-1 rounded-md">
                        <Zap className="h-3 w-3 mr-1" />
                        Power: {measurement.powerIndex}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Height:</span>
                      <div className="text-right">
                        <span className="font-medium text-jpblue-600">
                          {measurement.height} cm
                        </span>
                        {measurement.heightPercentile && (
                          <div className="text-xs text-gray-500">
                            {measurement.heightPercentile}th percentile
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Weight:</span>
                      <div className="text-right">
                        <span className="font-medium text-jpblue-600">
                          {measurement.weight} kg
                        </span>
                        {measurement.weightPercentile && (
                          <div className="text-xs text-gray-500">
                            {measurement.weightPercentile}th percentile
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">BMI:</span>
                      <div className="text-right">
                        <span className={`font-medium ${getBMIColor(measurement.bmi)}`}>
                          {measurement.bmi || 'N/A'}
                        </span>
                        {measurement.bmi && (
                          <div className="text-xs text-gray-500">
                            {getBMICategory(measurement.bmi)}
                          </div>
                        )}
                      </div>
                    </div>
                    {measurement.weightHeightRatio && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Weight/Height Ratio:</span>
                        <span className="font-medium text-jpblue-600">
                          {measurement.weightHeightRatio}
                        </span>
                      </div>
                    )}
                    {measurement.comparisonToAverage && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">vs Avg Height:</span>
                          <span className={`font-medium ${
                            measurement.comparisonToAverage.heightDiff > 0 ? 'text-green-600' :
                            measurement.comparisonToAverage.heightDiff < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {measurement.comparisonToAverage.heightDiff > 0 ? '+' : ''}{measurement.comparisonToAverage.heightDiff} cm
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">vs Avg Weight:</span>
                          <span className={`font-medium ${
                            measurement.comparisonToAverage.weightDiff > 0 ? 'text-green-600' :
                            measurement.comparisonToAverage.weightDiff < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {measurement.comparisonToAverage.weightDiff > 0 ? '+' : ''}{measurement.comparisonToAverage.weightDiff} kg
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {measurement.bmi && (
                    <div className="mt-3">
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-jpblue-500 to-jpblue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{
                            width: `${Math.min(100, Math.max(5, (measurement.bmi / 40) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Ruler className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterRikishi ? 'No measurements found' : 'No measurement data yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterRikishi
              ? 'Try adjusting your search criteria'
              : 'Import measurement data from the Sumo API to get started'}
          </p>
          {!searchTerm && !filterRikishi && (
            <div className="mt-3">
              <button
                onClick={handleImportMeasurements}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 disabled:opacity-50"
              >
                <Download className="-ml-1 mr-2 h-5 w-5" />
                {isLoading ? 'Importing...' : 'Import Measurements'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}