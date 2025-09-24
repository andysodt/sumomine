import React, { useState, useEffect } from 'react';
import { Download, Search, BarChart3, Trophy, AlertCircle } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { useLanguage } from '../context/LanguageContext';
import { KimariiteEntity } from '../types';
import { SumoApiService } from '../services/sumoApi';

export function KimaritePage() {
  const { state, loadKimarite } = useSumo();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name' | 'percentage'>('count');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredKimarite = state.kimarite.filter(kimarite => {
    const matchesSearch = kimarite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kimarite.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kimarite.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || kimarite.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedKimarite = [...filteredKimarite].sort((a, b) => {
    switch (sortBy) {
      case 'count':
        return b.count - a.count;
      case 'name':
        return a.nameEn.localeCompare(b.nameEn);
      case 'percentage':
        return (b.percentage || 0) - (a.percentage || 0);
      default:
        return 0;
    }
  });

  const uniqueCategories = [...new Set(state.kimarite.map(k => k.category))];
  const totalKimariteUsage = state.kimarite.reduce((sum, k) => sum + k.count, 0);

  const handleImportKimarite = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try different sorting options
      const sortOptions = ['count', 'kimarite', 'lastusage'];
      let kimariiteData: KimariiteEntity[] = [];

      for (const sortOption of sortOptions) {
        try {
          const data = await SumoApiService.fetchKimarite(sortOption);
          if (data && data.length > 0) {
            kimariiteData = data;
            break;
          }
        } catch (err) {
          console.log(`Failed to fetch with sort ${sortOption}:`, err);
        }
      }

      if (kimariiteData.length > 0) {
        loadKimarite(kimariiteData);
      } else {
        setError('No kimarite data available from the API. This may be normal if the database is empty.');
      }
    } catch (err) {
      setError(`Failed to import kimarite: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = (count: number) => {
    return totalKimariteUsage > 0 ? ((count / totalKimariteUsage) * 100).toFixed(2) : '0.00';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpred-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpred-600 to-jpred-700 bg-clip-text text-transparent">
                Kimarite (Winning Techniques)
              </h1>
              <p className="mt-2 text-gray-600">
                Explore sumo winning techniques and their usage statistics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {state.kimarite.length > 0 && (
              <div className="text-sm text-gray-500">
                {state.kimarite.length} techniques
              </div>
            )}
            <button
              onClick={handleImportKimarite}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {isLoading ? 'Importing...' : 'Import Kimarite'}
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

        {/* Filters and Sorting */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search kimarite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'count' | 'name' | 'percentage')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
            >
              <option value="count">Sort by Usage Count</option>
              <option value="name">Sort by Name</option>
              <option value="percentage">Sort by Percentage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {state.kimarite.length > 0 && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Techniques</p>
                <p className="text-2xl font-bold text-gray-900">{state.kimarite.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-jpred-500 to-jpred-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{totalKimariteUsage.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kimarite Grid */}
      {sortedKimarite.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedKimarite.map((kimarite, index) => (
            <div
              key={kimarite.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpred transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-6 py-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpred-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">技</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpred-700 transition-colors">
                          {kimarite.nameEn}
                        </h3>
                        <p className="text-sm font-medium text-jpred-600">{kimarite.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block">
                      {kimarite.category}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {kimarite.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Usage Count:</span>
                      <span className="font-medium text-jpblue-600">
                        {kimarite.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Percentage:</span>
                      <span className="font-medium text-jpred-600">
                        {getUsagePercentage(kimarite.count)}%
                      </span>
                    </div>
                    {kimarite.lastUsed && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Used:</span>
                        <span className="font-medium">
                          {new Date(kimarite.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-jpred-500 to-jpblue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{
                          width: `${Math.max(1, parseFloat(getUsagePercentage(kimarite.count)))}%`
                        }}
                      />
                    </div>
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
            {searchTerm || filterCategory ? 'No kimarite found' : 'No kimarite data yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterCategory
              ? 'Try adjusting your search criteria'
              : 'Import kimarite data from the Sumo API to get started'}
          </p>
          {!searchTerm && !filterCategory && (
            <div className="mt-6">
              <button
                onClick={handleImportKimarite}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Download className="-ml-1 mr-2 h-5 w-5" />
                {isLoading ? 'Importing...' : 'Import Kimarite'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}