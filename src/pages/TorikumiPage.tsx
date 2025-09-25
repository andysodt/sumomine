import { useState, useMemo, useEffect } from 'react';
import { Swords, Calendar, Search, Download, RefreshCw, Crown, Trophy, Medal } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import type { TorikumiEntity } from '../types';

export function TorikumiPage() {
  const { state, loadTorikumi } = useSumoDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedBasho, setSelectedBasho] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const divisions = useMemo(() => {
    if (!state.torikumi) return [];
    const divisionSet = new Set(state.torikumi.map(match => match.division).filter(Boolean));
    return Array.from(divisionSet).sort((a, b) => {
      const order = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [state.torikumi]);

  const days = useMemo(() => {
    if (!state.torikumi) return [];
    const daySet = new Set(state.torikumi.map(match => match.day).filter(Boolean));
    return Array.from(daySet).sort((a, b) => a - b);
  }, [state.torikumi]);

  const bashos = useMemo(() => {
    if (!state.torikumi) return [];
    const bashoSet = new Set(
      state.torikumi.map(match =>
        match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown')
      ).filter(Boolean)
    );
    return Array.from(bashoSet).sort((a, b) => {
      // Sort basho keys in descending order (latest first)
      const aNum = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return bNum - aNum;
    });
  }, [state.torikumi]);

  // Set the latest basho as default when data loads
  useEffect(() => {
    if (bashos.length > 0 && selectedBasho === '') {
      setSelectedBasho(bashos[0]); // bashos are sorted descending, so [0] is latest
    }
  }, [bashos, selectedBasho]);

  const filteredTorikumi = useMemo(() => {
    if (!state.torikumi) return [];
    return state.torikumi.filter(match => {
      const matchesSearch = (match.eastShikona || match.rikishi1Name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.westShikona || match.rikishi2Name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (match.winnerEn || match.winnerName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.kimarite?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'all' || match.division === selectedDivision;
      const matchesDay = selectedDay === 'all' || match.day.toString() === selectedDay;

      const matchBashoKey = match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown');
      const matchesBasho = selectedBasho === 'all' || selectedBasho === '' || matchBashoKey === selectedBasho;

      return matchesSearch && matchesDivision && matchesDay && matchesBasho;
    });
  }, [state.torikumi, searchTerm, selectedDivision, selectedDay, selectedBasho]);

  // Group matches by basho (tournament), then by day, then by division
  const groupedMatches = useMemo(() => {
    const groups: Record<string, Record<number, Record<string, TorikumiEntity[]>>> = {};

    filteredTorikumi.forEach(match => {
      // Create basho key
      const bashoKey = match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown');

      if (!groups[bashoKey]) {
        groups[bashoKey] = {};
      }

      if (!groups[bashoKey][match.day]) {
        groups[bashoKey][match.day] = {};
      }

      if (!groups[bashoKey][match.day][match.division]) {
        groups[bashoKey][match.day][match.division] = [];
      }

      groups[bashoKey][match.day][match.division].push(match);
    });

    // Sort matches within each division by highest rank first
    const getRankOrder = (rank: string) => {
      // Define ranking hierarchy (lower numbers = higher rank)
      if (rank.includes('Yokozuna')) return 1;
      if (rank.includes('Ozeki')) return 2;
      if (rank.includes('Sekiwake')) return 3;
      if (rank.includes('Komusubi')) return 4;
      if (rank.includes('Maegashira')) {
        // Extract number for Maegashira (e.g., "Maegashira 1" = 5, "Maegashira 2" = 6, etc.)
        const match = rank.match(/(\d+)/);
        const number = match ? parseInt(match[1]) : 17;
        return 4 + number; // Start after Komusubi
      }
      return 999; // Unknown ranks go to the bottom
    };

    Object.keys(groups).forEach(bashoKey => {
      Object.keys(groups[bashoKey]).forEach(day => {
        Object.keys(groups[bashoKey][parseInt(day)]).forEach(division => {
          groups[bashoKey][parseInt(day)][division].sort((a, b) => {
            const aEastRank = a.eastRank || '?';
            const aWestRank = a.westRank || '?';
            const bEastRank = b.eastRank || '?';
            const bWestRank = b.westRank || '?';

            // Get the highest rank in each match (lowest rank order number)
            const aHighestRank = Math.min(getRankOrder(aEastRank), getRankOrder(aWestRank));
            const bHighestRank = Math.min(getRankOrder(bEastRank), getRankOrder(bWestRank));

            // Sort by highest rank first (lower rank order = higher priority)
            if (aHighestRank !== bHighestRank) {
              return aHighestRank - bHighestRank;
            }

            // If same highest rank, use match number as tiebreaker
            return (a.matchNo || a.matchNumber || 0) - (b.matchNo || b.matchNumber || 0);
          });
        });
      });
    });

    return groups;
  }, [filteredTorikumi]);

  const handleImportTorikumi = async () => {
    setIsLoading(true);
    try {
      const bashos = await SumoApiService.fetchBashos();
      const recentBashoIds = bashos.map(b => typeof b.id === 'string' ? parseInt(b.id) : b.id).filter(id => !isNaN(id));
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
      case 'makuuchi': return 'bg-purple-50 border-purple-200';
      case 'juryo': return 'bg-blue-50 border-blue-200';
      case 'makushita': return 'bg-green-50 border-green-200';
      case 'sandanme': return 'bg-yellow-50 border-yellow-200';
      case 'jonidan': return 'bg-orange-50 border-orange-200';
      case 'jonokuchi': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getDivisionHeaderColor = (division: string) => {
    switch (division.toLowerCase()) {
      case 'makuuchi': return 'bg-purple-600 text-white';
      case 'juryo': return 'bg-blue-600 text-white';
      case 'makushita': return 'bg-green-600 text-white';
      case 'sandanme': return 'bg-yellow-600 text-white';
      case 'jonidan': return 'bg-orange-600 text-white';
      case 'jonokuchi': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getRankColor = (rank: string) => {
    if (rank.includes('Yokozuna')) return 'text-purple-800 font-bold';
    if (rank.includes('Ozeki')) return 'text-purple-700 font-bold';
    if (rank.includes('Sekiwake') || rank.includes('Komusubi')) return 'text-blue-700 font-semibold';
    if (rank.includes('Maegashira')) return 'text-green-700 font-medium';
    return 'text-gray-700';
  };

  const getWinnerStyle = (isWinner: boolean) => {
    return isWinner ? 'font-bold' : '';
  };

  const WinLossDot = ({ isWinner }: { isWinner: boolean }) => {
    return (
      <div className={`w-3 h-3 rounded-full border ${
        isWinner
          ? 'bg-white border-gray-800'
          : 'bg-gray-800 border-gray-800'
      }`} />
    );
  };

  // Calculate head-to-head record between two rikishi
  const getHeadToHeadRecord = (eastId: string | number, westId: string | number, eastName?: string, westName?: string) => {
    if (!state.torikumi) return { eastWins: 0, westWins: 0 };

    let eastWins = 0;
    let westWins = 0;

    state.torikumi.forEach(match => {
      const match1Id = match.eastId || match.rikishi1Id;
      const match2Id = match.westId || match.rikishi2Id;
      const match1Name = match.eastShikona || match.rikishi1Name;
      const match2Name = match.westShikona || match.rikishi2Name;

      // Check if this match involves both rikishi (by ID or name)
      const isMatch = (
        (match1Id === eastId && match2Id === westId) ||
        (match1Id === westId && match2Id === eastId) ||
        (eastName && westName &&
         ((match1Name === eastName && match2Name === westName) ||
          (match1Name === westName && match2Name === eastName)))
      );

      if (isMatch && match.winnerId) {
        if (match.winnerId === eastId || (eastName && match.winnerName === eastName)) {
          eastWins++;
        } else if (match.winnerId === westId || (westName && match.winnerName === westName)) {
          westWins++;
        }
      }
    });

    return { eastWins, westWins };
  };

  // Calculate basho win-loss record for a specific rikishi in a specific basho
  const getBashoRecord = (rikishiId: string | number, rikishiName: string, bashoKey: string) => {
    if (!state.torikumi) return { wins: 0, losses: 0 };

    let wins = 0;
    let losses = 0;

    // Filter matches for this specific basho and rikishi
    const bashoMatches = state.torikumi.filter(match => {
      const matchBashoKey = match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown');
      return matchBashoKey === bashoKey;
    });

    bashoMatches.forEach(match => {
      const eastId = match.eastId || match.rikishi1Id;
      const westId = match.westId || match.rikishi2Id;
      const eastName = match.eastShikona || match.rikishi1Name;
      const westName = match.westShikona || match.rikishi2Name;

      // Check if this rikishi participated in the match
      const isEastRikishi = eastId === rikishiId || eastName === rikishiName;
      const isWestRikishi = westId === rikishiId || westName === rikishiName;

      if (isEastRikishi || isWestRikishi) {
        if (match.winnerId) {
          const isWinner = match.winnerId === rikishiId || match.winnerName === rikishiName;
          if (isWinner) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    });

    return { wins, losses };
  };

  const formatTournamentInfo = () => {
    if (!state.torikumi?.length) return { title: 'No Tournament', day: '' };

    const latest = state.torikumi[0];
    const seasonNames = {
      1: 'Hatsu',
      3: 'Haru',
      5: 'Natsu',
      7: 'Nagoya',
      9: 'Aki',
      11: 'Kyushu'
    };

    const title = latest.year && latest.month
      ? `${seasonNames[latest.month as keyof typeof seasonNames] || 'Unknown'} ${latest.year}`
      : 'Tournament Results';

    const dayInfo = selectedDay !== 'all' ? `Day ${selectedDay}` : '';

    return { title, day: dayInfo };
  };

  const formatBashoName = (bashoKey: string, matches: TorikumiEntity[]) => {
    if (bashoKey === 'unknown') return 'Unknown Tournament';

    // Try to get tournament info from matches
    const match = matches[0];
    if (match?.year && match?.month) {
      const seasonNames = {
        1: 'Hatsu',
        3: 'Haru',
        5: 'Natsu',
        7: 'Nagoya',
        9: 'Aki',
        11: 'Kyushu'
      };
      return `${seasonNames[match.month as keyof typeof seasonNames] || 'Unknown'} ${match.year}`;
    }

    // Fallback to basho ID
    return bashoKey.length === 6
      ? `${bashoKey.substring(0, 4)} ${bashoKey.substring(4, 6)}`
      : bashoKey;
  };

  const tournamentInfo = formatTournamentInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {tournamentInfo.title} {tournamentInfo.day}
                </h1>
              </div>
              <p className="text-gray-600">Tournament Results</p>
            </div>
            <button
              onClick={handleImportTorikumi}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Import Results
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search wrestlers, techniques..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Divisions</option>
              {divisions.map(division => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>

            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Days</option>
              {days.map(day => (
                <option key={day} value={day.toString()}>Day {day}</option>
              ))}
            </select>

            <select
              value={selectedBasho}
              onChange={(e) => setSelectedBasho(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Bashos</option>
              {bashos.map(bashoKey => {
                const matches = state.torikumi?.filter(match => {
                  const matchBashoKey = match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown');
                  return matchBashoKey === bashoKey;
                }) || [];
                const bashoName = formatBashoName(bashoKey, matches);
                return (
                  <option key={bashoKey} value={bashoKey}>{bashoName}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results grouped by Basho → Day → Division */}
      <div className="container mx-auto px-3 py-3">
        {Object.keys(groupedMatches)
          .sort((a, b) => {
            // Sort basho keys in descending order (latest first)
            // bashoKey format is typically "YYYYMM" like "202401", "202403", etc.
            const aNum = parseInt(a.replace(/[^0-9]/g, '')) || 0;
            const bNum = parseInt(b.replace(/[^0-9]/g, '')) || 0;
            return bNum - aNum;
          })
          .map(bashoKey => {
          const bashoData = groupedMatches[bashoKey];
          const allBashoMatches = Object.values(bashoData).flat().flat();

          return (
            <div key={bashoKey} className="mb-5">
              {/* Basho Header */}
              <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-3 py-3 rounded-t-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">
                    {formatBashoName(bashoKey, allBashoMatches)}
                  </h1>
                  <span className="text-blue-200 text-sm">
                    ({allBashoMatches.length} matches)
                  </span>
                </div>
              </div>

              {/* Days within this Basho */}
              <div className="bg-white border-l-2 border-r-2 border-blue-200">
                {Object.keys(bashoData)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map(day => {
                    const dayData = bashoData[day];

                    return (
                      <div key={day} className="border-b border-gray-200 last:border-b-0">
                        {/* Day Header */}
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-800">
                              Day {day}
                            </h2>
                            <span className="text-gray-500 text-sm">
                              ({Object.values(dayData).flat().length} matches)
                            </span>
                          </div>
                        </div>

                        {/* Divisions within this Day */}
                        <div className="px-3 py-3">
                          {divisions.map(division => {
                            if (selectedDivision !== 'all' && selectedDivision !== division) return null;

                            const divisionMatches = dayData[division] || [];
                            if (divisionMatches.length === 0) return null;

                            return (
                              <div key={division} className="mb-3 last:mb-0">
                                {/* Division Header */}
                                <div className={`${getDivisionHeaderColor(division)} px-3 py-1.5 rounded-t-lg`}>
                                  <div className="flex items-center gap-2">
                                    <Medal className="h-4 w-4" />
                                    <h3 className="text-lg font-semibold">{division}</h3>
                                    <span className="text-sm opacity-75">
                                      ({divisionMatches.length} matches)
                                    </span>
                                  </div>
                                </div>

                                {/* Results Table */}
                                <div className={`${getDivisionColor(division)} border-2 rounded-b-lg overflow-hidden`}>
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr className="text-sm">
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">#</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">East</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-700">Rank</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-700">H2H</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-700">Rank</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">West</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-700">Technique</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {divisionMatches.map((match, index) => {
                                        const eastRikishi = match.eastShikona || match.rikishi1Name || `Rikishi ${match.eastId || match.rikishi1Id}`;
                                        const westRikishi = match.westShikona || match.rikishi2Name || `Rikishi ${match.westId || match.rikishi2Id}`;
                                        const eastRank = match.eastRank || '?';
                                        const westRank = match.westRank || '?';

                                        const isEastWinner = match.winnerId === (match.eastId || match.rikishi1Id);
                                        const isWestWinner = match.winnerId === (match.westId || match.rikishi2Id);

                                        return (
                                          <tr key={match.id} className={`border-t hover:bg-white/50 ${index % 2 === 0 ? 'bg-white/20' : ''}`}>
                                            <td className="py-2 px-3 text-sm text-gray-600 font-mono">
                                              {match.matchNo || match.matchNumber || index + 1}
                                            </td>

                                            {/* East Wrestler */}
                                            <td className={`py-2 px-3 text-right ${getWinnerStyle(isEastWinner)}`}>
                                              <div className="text-sm flex items-center justify-end gap-2">
                                                <div>
                                                  <div className="font-medium text-gray-900">
                                                    {eastRikishi}
                                                  </div>
                                                  {(() => {
                                                    const eastId = match.eastId || match.rikishi1Id;
                                                    const eastRecord = getBashoRecord(eastId, eastRikishi, bashoKey);
                                                    const total = eastRecord.wins + eastRecord.losses;
                                                    if (total > 0) {
                                                      return (
                                                        <div className="text-xs text-gray-500 font-mono">
                                                          {eastRecord.wins}-{eastRecord.losses}
                                                        </div>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                <WinLossDot isWinner={isEastWinner} />
                                              </div>
                                            </td>

                                            {/* East Rank */}
                                            <td className="py-2 px-3 text-center">
                                              <span className={`text-xs ${getRankColor(eastRank)}`}>
                                                {eastRank}
                                              </span>
                                            </td>

                                            {/* Head-to-Head Record */}
                                            <td className="py-2 px-3 text-center">
                                              {(() => {
                                                const eastId = match.eastId || match.rikishi1Id;
                                                const westId = match.westId || match.rikishi2Id;
                                                const { eastWins, westWins } = getHeadToHeadRecord(eastId, westId, eastRikishi, westRikishi);
                                                const total = eastWins + westWins;

                                                if (total === 0) {
                                                  return <span className="text-xs text-gray-400">First</span>;
                                                }

                                                return (
                                                  <span className="text-xs font-mono text-gray-700">
                                                    {eastWins}-{westWins}
                                                  </span>
                                                );
                                              })()}
                                            </td>

                                            {/* West Rank */}
                                            <td className="py-2 px-3 text-center">
                                              <span className={`text-xs ${getRankColor(westRank)}`}>
                                                {westRank}
                                              </span>
                                            </td>

                                            {/* West Wrestler */}
                                            <td className={`py-2 px-3 text-left ${getWinnerStyle(isWestWinner)}`}>
                                              <div className="text-sm flex items-center gap-2">
                                                <WinLossDot isWinner={isWestWinner} />
                                                <div>
                                                  <div className="font-medium text-gray-900">
                                                    {westRikishi}
                                                  </div>
                                                  {(() => {
                                                    const westId = match.westId || match.rikishi2Id;
                                                    const westRecord = getBashoRecord(westId, westRikishi, bashoKey);
                                                    const total = westRecord.wins + westRecord.losses;
                                                    if (total > 0) {
                                                      return (
                                                        <div className="text-xs text-gray-500 font-mono">
                                                          {westRecord.wins}-{westRecord.losses}
                                                        </div>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                              </div>
                                            </td>

                                            {/* Technique */}
                                            <td className="py-2 px-3 text-center">
                                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {match.kimarite || '—'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Basho Footer */}
              <div className="bg-blue-100 border-2 border-t-0 border-blue-200 rounded-b-lg px-3 py-2">
                <div className="text-sm text-blue-700 text-center">
                  Tournament Total: {allBashoMatches.length} matches
                </div>
              </div>
            </div>
          );
        })}

        {filteredTorikumi.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <Swords className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No Tournament Results</h3>
            <p className="text-gray-400">
              {(state.torikumi?.length || 0) === 0
                ? 'Import tournament data to see match results'
                : 'No matches found for the selected criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredTorikumi.length > 0 && (
        <div className="bg-white border-t">
          <div className="container mx-auto px-3 py-3">
            <div className="text-center text-sm text-gray-600">
              <p>
                Displaying {filteredTorikumi.length} matches
                {selectedBasho !== 'all' && selectedBasho !== '' && (() => {
                  const matches = state.torikumi?.filter(match => {
                    const matchBashoKey = match.bashoId || (match.year && match.month ? `${match.year}${String(match.month).padStart(2, '0')}` : 'unknown');
                    return matchBashoKey === selectedBasho;
                  }) || [];
                  return ` from ${formatBashoName(selectedBasho, matches)}`;
                })()}
                {selectedDivision !== 'all' && ` in ${selectedDivision}`}
                {selectedDay !== 'all' && ` from Day ${selectedDay}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}