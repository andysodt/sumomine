import { useState } from 'react';
import { Swords, Download, AlertCircle, Trophy } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { useLanguage } from '../context/LanguageContext';
import { SumoApiService } from '../services/sumoApi';

export function BoutsPage() {
  const { state, loadBouts } = useSumoDB();
  const { } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('');

  const handleImportBouts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all rikishi first to fetch their matches
      const allRikishi = await SumoApiService.fetchRikishi();

      if (allRikishi.length === 0) {
        setError('No rikishi data available. Please import rikishi data first.');
        return;
      }

      // Limit to first 10 rikishi for demo purposes to avoid overwhelming the API
      const rikishiToProcess = allRikishi.slice(0, 10);
      const rikishiIds = rikishiToProcess.map(r => r.id);

      console.log(`Fetching bouts for ${rikishiIds.length} rikishi`);

      const bouts = await SumoApiService.fetchEnhancedBouts(rikishiIds);

      if (bouts.length > 0) {
        loadBouts(bouts);
      } else {
        setError('No bout data found for the selected rikishi. This may be normal if matches are not available.');
      }
    } catch (err) {
      setError(`Failed to import bouts: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBouts = state.bouts.filter(bout => {
    const matchesSearch =
      bout.eastShikona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bout.westShikona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bout.winnerEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bout.kimarite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bout.bashoId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = filterDivision === '' || bout.division === filterDivision;
    return matchesSearch && matchesDivision;
  });

  const sortedBouts = filteredBouts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const uniqueDivisions = [...new Set(state.bouts.map(b => b.division).filter(Boolean))];

  const getRikishiName = (id: string) => {
    const rikishi = state.rikishi.find(r => r.id === id);
    return rikishi?.name || 'Unknown';
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Swords className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-600 to-jpblue-700 bg-clip-text text-transparent">
                Bouts (Matches)
              </h1>
              <p className="mt-2 text-gray-600">
                Sumo wrestling matches with detailed information
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {state.bouts.length > 0 && (
              <div className="text-sm text-gray-500">
                {state.bouts.length} bouts
              </div>
            )}
            <button
              onClick={handleImportBouts}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {isLoading ? 'Importing...' : 'Import Bouts'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {state.bouts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bouts by wrestler, kimarite, or basho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-jpblue-500 focus:border-jpblue-500"
              />
            </div>
            <div>
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-jpblue-500 focus:border-jpblue-500 rounded-md"
              >
                <option value="">All Divisions</option>
                {uniqueDivisions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {sortedBouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBouts.map((bout, index) => (
            <div
              key={bout.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpblue transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">勝</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpblue-700 transition-colors">
                          {bout.eastShikona || getRikishiName(bout.rikishi1Id)}
                        </h3>
                        <p className="text-sm font-medium text-jpblue-600">
                          vs {bout.westShikona || getRikishiName(bout.rikishi2Id)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {new Date(bout.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Day:</span>
                    <span className="font-medium">{bout.day}</span>
                  </div>

                  {bout.division && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Division:</span>
                      <span className="font-medium text-jpblue-600">{bout.division}</span>
                    </div>
                  )}

                  {bout.matchNo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Match #:</span>
                      <span className="font-medium">{bout.matchNo}</span>
                    </div>
                  )}

                  {bout.eastRank && bout.westRank && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ranks:</span>
                      <span className="font-medium">
                        {bout.eastRank} vs {bout.westRank}
                      </span>
                    </div>
                  )}

                  {bout.winnerEn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner:
                      </span>
                      <span className="font-medium text-green-600">
                        {bout.winnerEn}
                      </span>
                    </div>
                  )}

                  {bout.kimarite && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Kimarite:</span>
                      <span className="font-medium text-jpblue-600">
                        {bout.kimarite}
                      </span>
                    </div>
                  )}

                  {bout.bashoId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Basho:</span>
                      <span className="font-medium text-gray-600">
                        {bout.bashoId.replace('basho-', '')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-jpblue-50 text-jpblue-700 hover:bg-jpblue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Swords className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterDivision ? 'No bouts found' : 'No bout data yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterDivision
              ? 'Try adjusting your search criteria'
              : 'Import bout data from the Sumo API to get started'}
          </p>
          {!searchTerm && !filterDivision && (
            <div className="mt-6">
              <button
                onClick={handleImportBouts}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 disabled:opacity-50"
              >
                <Download className="-ml-1 mr-2 h-5 w-5" />
                {isLoading ? 'Importing...' : 'Import Bouts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}