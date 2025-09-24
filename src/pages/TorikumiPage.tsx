import { useState, useMemo } from 'react';
import { Swords, Calendar, Search, Download, RefreshCw, Crown, Clock } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import type { TorikumiEntity } from '../types';

export function TorikumiPage() {
  const { state, loadTorikumi } = useSumoDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'day' | 'division' | 'match' | 'year'>('day');
  const [isLoading, setIsLoading] = useState(false);

  const divisions = useMemo(() => {
    if (!state.torikumi) return [];
    const divisionSet = new Set(state.torikumi.map(match => match.division).filter(Boolean));
    return Array.from(divisionSet).sort();
  }, [state.torikumi]);

  const days = useMemo(() => {
    if (!state.torikumi) return [];
    const daySet = new Set(state.torikumi.map(match => match.day).filter(Boolean));
    return Array.from(daySet).sort((a, b) => a - b);
  }, [state.torikumi]);

  const filteredAndSortedTorikumi = useMemo(() => {
    if (!state.torikumi) return [];
    const filtered = state.torikumi.filter(match => {
      const matchesSearch = (match.eastShikona || match.rikishi1Name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.westShikona || match.rikishi2Name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.winnerEn || match.winnerName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.kimarite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.eastRank || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.westRank || '')?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'all' || match.division === selectedDivision;
      const matchesDay = selectedDay === 'all' || match.day.toString() === selectedDay;
      const matchesStatus = selectedStatus === 'all' ||
                           (selectedStatus === 'decided' && (match.isDecided ?? true)) ||  // Default to true if not set (API data is always decided)
                           (selectedStatus === 'pending' && (match.isDecided === false));
      return matchesSearch && matchesDivision && matchesDay && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'day':
          return a.day - b.day || (a.matchNo || a.matchNumber || 0) - (b.matchNo || b.matchNumber || 0);
        case 'division':
          return a.division.localeCompare(b.division) || a.day - b.day;
        case 'match':
          return (a.matchNo || a.matchNumber || 0) - (b.matchNo || b.matchNumber || 0);
        case 'year':
          return (b.year || 0) - (a.year || 0) || (b.month || 0) - (a.month || 0);
        default:
          return 0;
      }
    });
  }, [state.torikumi, searchTerm, selectedDivision, selectedDay, selectedStatus, sortBy]);

  const stats = useMemo(() => {
    const totalMatches = state.torikumi?.length || 0;
    const decidedMatches = state.torikumi?.filter(match => match.isDecided ?? true).length || 0;  // API data is always decided
    const pendingMatches = state.torikumi?.filter(match => match.isDecided === false).length || 0;

    const divisionCounts = divisions.reduce((acc, division) => {
      if (division) {
        acc[division] = state.torikumi?.filter(match => match.division === division).length || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get latest tournament data
    const latestYear = Math.max(...(state.torikumi?.map(match => match.year || 0) || [0]));
    const latestMonth = Math.max(...(state.torikumi?.filter(match => match.year === latestYear).map(match => match.month || 0) || [0]));

    return {
      total: totalMatches,
      decided: decidedMatches,
      pending: pendingMatches,
      divisions: divisionCounts,
      latestTournament: latestYear && latestMonth ? `${latestYear}/${String(latestMonth).padStart(2, '0')}` : 'N/A'
    };
  }, [state.torikumi, divisions]);

  const handleImportTorikumi = async () => {
    setIsLoading(true);
    try {
      // Get recent bashos for torikumi import
      const bashos = await SumoApiService.fetchBashos();
      const recentBashoIds = bashos.slice(0, 2).map(b => typeof b.id === 'string' ? parseInt(b.id) : b.id).filter(id => !isNaN(id)); // Get latest 2 bashos
      const torikumi = await SumoApiService.fetchAllTorikumiEntities(recentBashoIds);
      loadTorikumi(torikumi);
    } catch (error) {
      console.error('Failed to import torikumi:', error);
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

  const getStatusColor = (isDecided: boolean) => {
    return isDecided ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  const formatDate = (match: TorikumiEntity) => {
    if (match.year && match.month) {
      return `${match.year}/${String(match.month).padStart(2, '0')}`;
    }
    return match.bashoId || 'Unknown';
  };

  const formatMatchup = (match: TorikumiEntity) => {
    const rikishi1 = match.rikishi1Name || `Rikishi ${match.rikishi1Id}`;
    const rikishi2 = match.rikishi2Name || `Rikishi ${match.rikishi2Id}`;
    return `${rikishi1} vs ${rikishi2}`;
  };

  const getWinnerDisplay = (match: TorikumiEntity) => {
    if (!match.isDecided && match.isDecided !== undefined) {
      return <span className="text-gray-500 italic">TBD</span>;
    }
    if (match.winnerName) {
      return (
        <div className="flex items-center gap-1">
          <Crown className="h-3 w-3 text-yellow-500" />
          <span className="font-medium text-gray-900">{match.winnerName}</span>
        </div>
      );
    }
    return <span className="text-gray-500">Unknown</span>;
  };

  const getWinnerDisplayEnhanced = (match: TorikumiEntity) => {
    const winnerName = match.winnerEn || match.winnerName;
    if (!winnerName) {
      return <span className="text-gray-500">TBD</span>;
    }

    const isEastWinner = match.winnerId === (match.eastId || match.rikishi1Id);
    const winnerSide = isEastWinner ? 'E' : 'W';

    return (
      <div className="flex items-center gap-1">
        <Crown className="h-3 w-3 text-yellow-500" />
        <span className="font-medium text-gray-900">{winnerName}</span>
        <span className={`text-xs px-1 rounded ${isEastWinner ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
          {winnerSide}
        </span>
      </div>
    );
  };

  const getTechniqueColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Extreme': return 'text-red-600';
      case 'Hard': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Easy': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'Senshuraku': return 'text-red-700 bg-red-100';
      case 'Playoff': return 'text-purple-700 bg-purple-100';
      case 'Special': return 'text-yellow-700 bg-yellow-100';
      case 'Regular': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Swords className="h-8 w-8 text-jpblue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Torikumi</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Tournament Matches</span>
        </div>
        <button
          onClick={handleImportTorikumi}
          disabled={isLoading}
          className="flex items-center gap-2 bg-jpblue-600 text-white px-4 py-2 rounded-lg hover:bg-jpblue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Torikumi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Swords className="h-8 w-8 text-jpblue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Decided</p>
              <p className="text-2xl font-bold text-green-600">{stats.decided}</p>
            </div>
            <Crown className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Latest Tournament</p>
            <p className="text-lg font-bold text-jpblue-600 mb-2">{stats.latestTournament}</p>
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
                placeholder="Search by rikishi names, winner, or kimarite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
              />
            </div>
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Divisions</option>
            {divisions.map(division => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Days</option>
            {days.map(day => (
              <option key={day} value={day.toString()}>Day {day}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Status</option>
            <option value="decided">Decided</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'day' | 'division' | 'match' | 'year')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="day">Sort by Day</option>
            <option value="division">Sort by Division</option>
            <option value="match">Sort by Match #</option>
            <option value="year">Sort by Year</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Day</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Match #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">East</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">West</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Division</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Winner</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Kimarite</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Match Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tournament</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTorikumi.map((match) => (
                <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">Day {match.day}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-gray-700">
                      #{match.matchNo || match.matchNumber || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {match.eastShikona || match.rikishi1Name || `Rikishi ${match.eastId || match.rikishi1Id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.eastRank || 'Unknown rank'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {match.westShikona || match.rikishi2Name || `Rikishi ${match.westId || match.rikishi2Id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.westRank || 'Unknown rank'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDivisionColor(match.division)}`}>
                      {match.division}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getWinnerDisplayEnhanced(match)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {match.kimarite || '-'}
                    </div>
                    {match.technique?.difficulty && (
                      <div className={`text-xs ${getTechniqueColor(match.technique.difficulty)}`}>
                        {match.technique.difficulty}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {match.matchType && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.matchType)}`}>
                        {match.matchType}
                      </span>
                    )}
                    {match.upsetProbability && match.upsetProbability !== 'Expected' && (
                      <div className="text-xs text-red-600 mt-1">
                        {match.upsetProbability}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">{formatDate(match)}</div>
                    {match.seasonName && (
                      <div className="text-xs text-gray-500">
                        {match.seasonName}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedTorikumi.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                    {(state.torikumi?.length || 0) === 0 ? 'No torikumi data available. Import torikumi to get started.' : 'No matches match your search criteria.'}
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