import { useState } from 'react';
import { Trophy, Download, Award, AlertCircle } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { useLanguage } from '../context/LanguageContext';
import { SumoApiService } from '../services/sumoApi';

export function TournamentsPage() {
  const { state, loadBashos } = useSumoDB();
  const { } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deduplicate basho by ID to avoid duplicate keys
  const uniqueBasho = Array.from(
    new Map(state.basho.map(basho => [basho.id, basho])).values()
  );

  const handleImportBashos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const bashos = await SumoApiService.fetchEnhancedBashos();

      if (bashos.length > 0) {
        await loadBashos();
      } else {
        setError('No basho data found. This may be normal if recent tournaments are not yet available.');
      }
    } catch (err) {
      setError(`Failed to import bashos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-600 to-jpblue-700 bg-clip-text text-transparent">
                Basho (Tournaments)
              </h1>
              <p className="mt-2 text-gray-600">
                Grand sumo tournaments with champions and special prizes
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {uniqueBasho.length > 0 && (
              <div className="text-sm text-gray-500">
                {uniqueBasho.length} tournaments
              </div>
            )}
            <button
              onClick={handleImportBashos}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {isLoading ? 'Importing...' : 'Import Bashos'}
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
      </div>

      {uniqueBasho.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueBasho.map((basho, index) => (
            <div
              key={basho.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpblue transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">場</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpblue-700 transition-colors">
                          {basho.name}
                        </h3>
                        <p className="text-sm font-medium text-jpblue-600">{basho.division}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {new Date(basho.startDate).toLocaleDateString()} - {new Date(basho.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Participants:</span>
                    <span className="font-medium">{basho.participants.length}</span>
                  </div>
                  {basho.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Venue:</span>
                      <span className="font-medium text-jpblue-600">{basho.location}</span>
                    </div>
                  )}
                  {basho.date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date Code:</span>
                      <span className="font-medium">{basho.date}</span>
                    </div>
                  )}
                </div>

                {/* Yusho Winners */}
                {basho.yusho && basho.yusho.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Trophy className="h-4 w-4 mr-1 text-jpblue-600" />
                      Champions
                    </h4>
                    <div className="space-y-1">
                      {basho.yusho.map((winner, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-500">{winner.type}:</span>
                          <span className="font-medium text-jpblue-600">
                            {winner.shikonaEn || winner.shikonaJp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Prizes */}
                {basho.specialPrizes && basho.specialPrizes.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-jpblue-600" />
                      Special Prizes
                    </h4>
                    <div className="space-y-1">
                      {basho.specialPrizes.slice(0, 3).map((prize, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-500">{prize.type}:</span>
                          <span className="font-medium text-jpblue-600">
                            {prize.shikonaEn || prize.shikonaJp}
                          </span>
                        </div>
                      ))}
                      {basho.specialPrizes.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{basho.specialPrizes.length - 3} more prizes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3">
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
            <Trophy className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No basho data yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Import tournament data from the Sumo API to get started
          </p>
          <div className="mt-3">
            <button
              onClick={handleImportBashos}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 disabled:opacity-50"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {isLoading ? 'Importing...' : 'Import Bashos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}