import React, { useState, useMemo } from 'react';
import { Award, TrendingUp, TrendingDown, Search, Download, RefreshCw } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { SumoApiService } from '../services/sumoApi';
import type { RankEntity } from '../types';

export function RanksPage() {
  const { state, loadRanks } = useSumo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSide, setSelectedSide] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'division'>('rank');
  const [isLoading, setIsLoading] = useState(false);

  const divisions = useMemo(() => {
    if (!state.ranks) return [];
    const divisionSet = new Set(state.ranks.map(rank => rank.division).filter(Boolean));
    return Array.from(divisionSet).sort();
  }, [state.ranks]);

  const filteredAndSortedRanks = useMemo(() => {
    if (!state.ranks) return [];
    let filtered = state.ranks.filter(rank => {
      const matchesSearch = rank.rikishiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rank.rank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'all' || rank.division === selectedDivision;
      const matchesSide = selectedSide === 'all' || rank.side === selectedSide;
      return matchesSearch && matchesDivision && matchesSide;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.rikishiName || '').localeCompare(b.rikishiName || '');
        case 'rank':
          return a.rankValue - b.rankValue;
        case 'division':
          return (a.division || '').localeCompare(b.division || '');
        default:
          return 0;
      }
    });
  }, [state.ranks, searchTerm, selectedDivision, selectedSide, sortBy]);

  const stats = useMemo(() => {
    const totalRanks = state.ranks?.length || 0;
    const divisionCounts = divisions.reduce((acc, division) => {
      if (division) {
        acc[division] = state.ranks?.filter(rank => rank.division === division).length || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    const eastCount = state.ranks?.filter(rank => rank.side === 'East').length || 0;
    const westCount = state.ranks?.filter(rank => rank.side === 'West').length || 0;

    return {
      total: totalRanks,
      divisions: divisionCounts,
      east: eastCount,
      west: westCount
    };
  }, [state.ranks, divisions]);

  const handleImportRanks = async () => {
    setIsLoading(true);
    try {
      // Get some sample rikishi IDs to fetch ranks for
      const rikishi = await SumoApiService.fetchActiveRikishi();
      const rikishiIds = rikishi.slice(0, 10).map(r => r.id); // Limit to first 10 for demo
      const ranks = await SumoApiService.fetchAllRanks(rikishiIds);
      loadRanks(ranks);
    } catch (error) {
      console.error('Failed to import ranks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankDisplayColor = (rank: RankEntity) => {
    if (!rank.division) return 'text-gray-600';

    switch (rank.division.toLowerCase()) {
      case 'makuuchi':
        return 'text-purple-600';
      case 'juryo':
        return 'text-blue-600';
      case 'makushita':
        return 'text-green-600';
      case 'sandanme':
        return 'text-yellow-600';
      case 'jonidan':
        return 'text-orange-600';
      case 'jonokuchi':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSideIcon = (side?: string) => {
    if (side === 'East') return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (side === 'West') return <TrendingDown className="h-4 w-4 text-blue-500" />;
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Ranks</h1>
        </div>
        <button
          onClick={handleImportRanks}
          disabled={isLoading}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Ranks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ranks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
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
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Divisions</p>
            <div className="space-y-1">
              {Object.entries(stats.divisions).slice(0, 3).map(([division, count]) => (
                <div key={division} className="flex justify-between text-sm">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Divisions</option>
            {divisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>

          <select
            value={selectedSide}
            onChange={(e) => setSelectedSide(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Sides</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rank' | 'division')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="rank">Sort by Rank</option>
            <option value="name">Sort by Name</option>
            <option value="division">Sort by Division</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rikishi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Division</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Side</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rank Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Basho</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRanks.map((rank) => (
                <tr key={rank.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {rank.rikishiName || `Rikishi ${rank.rikishiId}`}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${getRankDisplayColor(rank)}`}>
                      {rank.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankDisplayColor(rank)} bg-opacity-10`}>
                      {rank.division || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getSideIcon(rank.side)}
                      <span className="text-sm text-gray-600">{rank.side || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{rank.rankValue}</td>
                  <td className="py-3 px-4 text-gray-600">{rank.bashoId}</td>
                </tr>
              ))}
              {filteredAndSortedRanks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                    {(state.ranks?.length || 0) === 0 ? 'No ranks data available. Import ranks to get started.' : 'No ranks match your search criteria.'}
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