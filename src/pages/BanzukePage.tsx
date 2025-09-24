import { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Search, Download, RefreshCw } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import type { BanzukeEntity } from '../types';

export function BanzukePage() {
  const { state, loadBanzuke } = useSumoDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSide, setSelectedSide] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'division' | 'year'>('rank');
  const [isLoading, setIsLoading] = useState(false);

  const divisions = useMemo(() => {
    if (!state.banzuke) return [];
    const divisionSet = new Set(state.banzuke.map(entry => entry.division).filter(Boolean));
    return Array.from(divisionSet).sort();
  }, [state.banzuke]);

  const filteredAndSortedBanzuke = useMemo(() => {
    if (!state.banzuke) return [];
    let filtered = state.banzuke.filter(entry => {
      const matchesSearch = entry.rikishiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.rank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'all' || entry.division === selectedDivision;
      const matchesSide = selectedSide === 'all' || entry.side === selectedSide;
      return matchesSearch && matchesDivision && matchesSide;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.rikishiName || '').localeCompare(b.rikishiName || '');
        case 'rank':
          return a.rank.localeCompare(b.rank);
        case 'division':
          return (a.division || '').localeCompare(b.division || '');
        case 'year':
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });
  }, [state.banzuke, searchTerm, selectedDivision, selectedSide, sortBy]);

  const stats = useMemo(() => {
    const totalEntries = state.banzuke?.length || 0;
    const divisionCounts = divisions.reduce((acc, division) => {
      if (division) {
        acc[division] = state.banzuke?.filter(entry => entry.division === division).length || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    const eastCount = state.banzuke?.filter(entry => entry.side === 'East').length || 0;
    const westCount = state.banzuke?.filter(entry => entry.side === 'West').length || 0;

    // Calculate additional stats from the API data
    const totalWins = state.banzuke?.reduce((sum, entry) => sum + (entry.wins || 0), 0) || 0;
    const totalLosses = state.banzuke?.reduce((sum, entry) => sum + (entry.losses || 0), 0) || 0;
    const totalAbsences = state.banzuke?.reduce((sum, entry) => sum + (entry.absences || 0), 0) || 0;

    const averageWinRate = state.banzuke?.length ?
      state.banzuke.reduce((sum, entry) => sum + (entry.winRate || 0), 0) / state.banzuke.length : 0;

    // Performance distribution
    const performanceCounts = state.banzuke?.reduce((acc, entry) => {
      const perf = entry.performance || 'Unknown';
      acc[perf] = (acc[perf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get latest tournament data
    const latestYear = Math.max(...(state.banzuke?.map(entry => entry.year || 0) || [0]));
    const latestMonth = Math.max(...(state.banzuke?.filter(entry => entry.year === latestYear).map(entry => entry.month || 0) || [0]));

    return {
      total: totalEntries,
      divisions: divisionCounts,
      east: eastCount,
      west: westCount,
      totalWins,
      totalLosses,
      totalAbsences,
      averageWinRate,
      performanceCounts,
      latestTournament: latestYear && latestMonth ? `${latestYear}/${String(latestMonth).padStart(2, '0')}` : 'N/A'
    };
  }, [state.banzuke, divisions]);

  const handleImportBanzuke = async () => {
    setIsLoading(true);
    try {
      const banzuke = await SumoApiService.fetchAllBanzukeEntities();
      loadBanzuke(banzuke);
    } catch (error) {
      console.error('Failed to import banzuke:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division.toLowerCase()) {
      case 'makuuchi':
        return 'text-purple-600 bg-purple-100';
      case 'juryo':
        return 'text-blue-600 bg-blue-100';
      case 'makushita':
        return 'text-green-600 bg-green-100';
      case 'sandanme':
        return 'text-yellow-600 bg-yellow-100';
      case 'jonidan':
        return 'text-orange-600 bg-orange-100';
      case 'jonokuchi':
        return 'text-jpblue-600 bg-jpblue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSideIcon = (side: string) => {
    if (side === 'East') return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (side === 'West') return <TrendingDown className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent':
        return 'text-green-700 bg-green-100';
      case 'Good':
        return 'text-blue-700 bg-blue-100';
      case 'Average':
        return 'text-yellow-700 bg-yellow-100';
      case 'Poor':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (entry: BanzukeEntity) => {
    if (entry.year && entry.month) {
      return `${entry.year}/${String(entry.month).padStart(2, '0')}`;
    }
    return entry.bashoId || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900">Banzuke</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Tournament Rankings</span>
        </div>
        <button
          onClick={handleImportBanzuke}
          disabled={isLoading}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Banzuke
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Trophy className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">East Side</p>
              <p className="text-2xl font-bold text-orange-600">{stats.east}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">West Side</p>
              <p className="text-2xl font-bold text-blue-600">{stats.west}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wins</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalWins}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Win Rate</p>
              <p className="text-2xl font-bold text-jpblue-600">{(stats.averageWinRate * 100).toFixed(1)}%</p>
            </div>
            <Trophy className="h-8 w-8 text-jpblue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Latest Tournament</p>
            <p className="text-lg font-bold text-amber-600 mb-2">{stats.latestTournament}</p>
            <div className="space-y-1">
              {Object.entries(stats.divisions).slice(0, 2).map(([division, count]) => (
                <div key={division} className="flex justify-between text-xs">
                  <span className="text-gray-600">{division}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by rikishi name or rank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">All Divisions</option>
            {divisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>

          <select
            value={selectedSide}
            onChange={(e) => setSelectedSide(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">All Sides</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rank' | 'division' | 'year')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="rank">Sort by Rank</option>
            <option value="name">Sort by Name</option>
            <option value="division">Sort by Division</option>
            <option value="year">Sort by Year</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rikishi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rank Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Division</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Side</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Record</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Win Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tournament</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBanzuke.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {entry.rikishiName || `Rikishi ${entry.rikishiId}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {entry.rikishiId}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-amber-600">
                      {entry.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-gray-700">
                      {entry.rankValue || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDivisionColor(entry.division)}`}>
                      {entry.division}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getSideIcon(entry.side)}
                      <span className="text-sm text-gray-600">{entry.side}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.wins || 0}W - {entry.losses || 0}L
                    </div>
                    {entry.absences && entry.absences > 0 && (
                      <div className="text-xs text-red-500">
                        {entry.absences} absent
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium">
                      {entry.winRate ? `${(entry.winRate * 100).toFixed(1)}%` : '-'}
                    </div>
                    <div className={`text-xs ${entry.winRate && entry.winRate > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.totalMatches ? `${entry.totalMatches} matches` : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {entry.performance && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(entry.performance)}`}>
                        {entry.performance}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">{formatDate(entry)}</div>
                    {entry.seasonName && (
                      <div className="text-xs text-gray-500">
                        {entry.seasonName}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedBanzuke.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                    {(state.banzuke?.length || 0) === 0 ? 'No banzuke data available. Import banzuke to get started.' : 'No entries match your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}