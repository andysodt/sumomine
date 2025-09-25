import { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Search, Download, RefreshCw, Crown } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import type { BanzukeEntity } from '../types';

export function BanzukePage() {
  const { state, loadBanzuke } = useSumoDB();
  const [selectedDivision, setSelectedDivision] = useState<string>('Makuuchi');
  const [selectedTournament, setSelectedTournament] = useState<string>('latest');
  const [isLoading, setIsLoading] = useState(false);

  const divisions = useMemo(() => {
    if (!state.banzuke) return [];
    const divisionSet = new Set(state.banzuke.map(entry => entry.division).filter(Boolean));
    return Array.from(divisionSet).sort((a, b) => {
      const order = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [state.banzuke]);

  const tournaments = useMemo(() => {
    if (!state.banzuke) return [];
    const tournamentSet = new Set(state.banzuke.map(entry => {
      if (entry.year && entry.month) {
        return `${entry.year}/${String(entry.month).padStart(2, '0')}`;
      }
      return entry.bashoId || 'Unknown';
    }));
    return Array.from(tournamentSet).sort().reverse();
  }, [state.banzuke]);

  const banzukeData = useMemo(() => {
    if (!state.banzuke) return { east: [], west: [] };

    // Filter by selected division and tournament
    let filtered = state.banzuke.filter(entry => {
      const matchesDivision = selectedDivision === 'all' || entry.division === selectedDivision;
      let matchesTournament = true;

      if (selectedTournament !== 'all' && selectedTournament !== 'latest') {
        const entryTournament = entry.year && entry.month ?
          `${entry.year}/${String(entry.month).padStart(2, '0')}` :
          entry.bashoId;
        matchesTournament = entryTournament === selectedTournament;
      } else if (selectedTournament === 'latest') {
        // Get the most recent tournament
        const latestYear = Math.max(...(state.banzuke?.map(e => e.year || 0) || [0]));
        const latestMonth = Math.max(...(state.banzuke?.filter(e => e.year === latestYear).map(e => e.month || 0) || [0]));
        matchesTournament = entry.year === latestYear && entry.month === latestMonth;
      }

      return matchesDivision && matchesTournament;
    });

    // Group by East/West and sort by rank value
    const east = filtered
      .filter(entry => entry.side === 'East')
      .sort((a, b) => (a.rankValue || 999) - (b.rankValue || 999));

    const west = filtered
      .filter(entry => entry.side === 'West')
      .sort((a, b) => (a.rankValue || 999) - (b.rankValue || 999));

    return { east, west };
  }, [state.banzuke, selectedDivision, selectedTournament]);

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
        return 'text-purple-900 bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300';
      case 'juryo':
        return 'text-blue-900 bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300';
      case 'makushita':
        return 'text-green-900 bg-gradient-to-r from-green-100 to-green-200 border-green-300';
      case 'sandanme':
        return 'text-yellow-900 bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300';
      case 'jonidan':
        return 'text-orange-900 bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300';
      case 'jonokuchi':
        return 'text-red-900 bg-gradient-to-r from-red-100 to-red-200 border-red-300';
      default:
        return 'text-gray-900 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
    }
  };

  const getRankColor = (rank: string, division: string) => {
    if (rank.includes('Yokozuna')) return 'text-purple-800 font-black';
    if (rank.includes('Ozeki')) return 'text-purple-700 font-bold';
    if (rank.includes('Sekiwake') || rank.includes('Komusubi')) return 'text-blue-700 font-bold';
    if (rank.includes('Maegashira') || division === 'Makuuchi') return 'text-green-700 font-semibold';
    if (division === 'Juryo') return 'text-blue-600 font-semibold';
    return 'text-gray-700 font-medium';
  };

  const formatRikishiName = (entry: BanzukeEntity) => {
    return entry.rikishiName || `Rikishi ${entry.rikishiId}`;
  };

  const RikishiCard = ({ entry, side }: { entry: BanzukeEntity, side: 'east' | 'west' }) => (
    <div className={`
      relative p-3 mb-1.5 rounded-lg border-2 shadow-lg hover:shadow-xl transition-all duration-200
      ${getDivisionColor(entry.division)}
      ${side === 'east' ? 'ml-0 mr-1.5' : 'ml-1.5 mr-0'}
      transform hover:scale-105
    `}>
      {/* Rank Badge */}
      <div className={`
        absolute -top-2 ${side === 'east' ? 'left-2' : 'right-2'}
        px-3 py-1 rounded-full text-xs font-bold
        ${entry.rank.includes('Yokozuna') ? 'bg-purple-600 text-white' :
          entry.rank.includes('Ozeki') ? 'bg-purple-500 text-white' :
          entry.rank.includes('Sekiwake') || entry.rank.includes('Komusubi') ? 'bg-blue-500 text-white' :
          'bg-amber-500 text-white'}
      `}>
        {entry.rank}
      </div>

      {/* Side Indicator */}
      <div className={`
        absolute -top-2 ${side === 'east' ? 'right-2' : 'left-2'}
        px-2 py-1 rounded-full text-xs font-bold
        ${side === 'east' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}
      `}>
        {side === 'east' ? '東' : '西'}
      </div>

      {/* Rikishi Name */}
      <div className="mt-1.5 mb-1.5">
        <div className={`text-lg font-bold ${getRankColor(entry.rank, entry.division)} text-center`}>
          {formatRikishiName(entry)}
        </div>
        {entry.rank.includes('Yokozuna') && (
          <div className="flex justify-center mt-1">
            <Crown className="h-4 w-4 text-purple-600" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-center space-y-0.5">
        <div className="text-sm font-semibold text-gray-700">
          {entry.wins || 0}勝 - {entry.losses || 0}敗
        </div>
        {entry.winRate && (
          <div className={`text-xs font-medium ${entry.winRate > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
            {(entry.winRate * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Rank Value */}
      <div className="text-center text-xs text-gray-500 mt-1">
        #{entry.rankValue || '?'}
      </div>
    </div>
  );

  // Group rikishi by rank hierarchy for traditional display
  const maxLength = Math.max(banzukeData.east.length, banzukeData.west.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-25 to-white">
      {/* Traditional Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white py-5 mb-5 shadow-lg">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-12 w-12 text-amber-200" />
              <div>
                <h1 className="text-4xl font-bold mb-2">番付 Banzuke</h1>
                <p className="text-amber-200 text-lg">Traditional Sumo Rankings</p>
              </div>
            </div>
            <button
              onClick={handleImportBanzuke}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white text-amber-700 px-3 py-3 rounded-lg hover:bg-amber-50 disabled:opacity-50 font-semibold shadow-lg"
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              Import Banzuke
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-3 mb-5">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All Divisions</option>
                {divisions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tournament</label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="latest">Latest Tournament</option>
                <option value="all">All Tournaments</option>
                {tournaments.map(tournament => (
                  <option key={tournament} value={tournament}>{tournament}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Traditional Banzuke Layout */}
      <div className="container mx-auto px-3">
        <div className="bg-white rounded-lg shadow-xl p-4">
          {/* Division Header */}
          <div className="text-center mb-5">
            <div className={`
              inline-block px-3 py-3 rounded-lg text-2xl font-bold border-2
              ${getDivisionColor(selectedDivision)}
            `}>
              {selectedDivision === 'all' ? '全階級' : selectedDivision}
            </div>
          </div>

          {/* Side Headers */}
          <div className="grid grid-cols-2 gap-5 mb-3">
            <div className="text-center">
              <div className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-xl shadow-lg">
                <TrendingUp className="inline h-6 w-6 mr-2" />
                東 EAST
              </div>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-lg font-bold text-xl shadow-lg">
                <TrendingDown className="inline h-6 w-6 mr-2" />
                西 WEST
              </div>
            </div>
          </div>

          {/* Main Banzuke Grid */}
          {maxLength > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {/* East Side */}
              <div className="space-y-1.5">
                {Array.from({ length: maxLength }, (_, index) => {
                  const entry = banzukeData.east[index];
                  return entry ? (
                    <RikishiCard key={entry.id} entry={entry} side="east" />
                  ) : (
                    <div key={`empty-east-${index}`} className="h-24"></div>
                  );
                })}
              </div>

              {/* West Side */}
              <div className="space-y-1.5">
                {Array.from({ length: maxLength }, (_, index) => {
                  const entry = banzukeData.west[index];
                  return entry ? (
                    <RikishiCard key={entry.id} entry={entry} side="west" />
                  ) : (
                    <div key={`empty-west-${index}`} className="h-24"></div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No Banzuke Data</h3>
              <p className="text-gray-400">
                {(state.banzuke?.length || 0) === 0
                  ? 'Import banzuke data to see traditional rankings'
                  : 'No data available for the selected filters'}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-5 pt-3 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-full mb-1"></div>
                  <span className="text-xs">Yokozuna</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full mb-1"></div>
                  <span className="text-xs">Ozeki</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mb-1"></div>
                  <span className="text-xs">Sanyaku</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-amber-500 rounded-full mb-1"></div>
                  <span className="text-xs">Others</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full mb-1"></div>
                  <span className="text-xs">東 East</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mb-1"></div>
                  <span className="text-xs">西 West</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}