import { useState, useMemo } from 'react';
import { TrendingUp, Search, Users, Download, RefreshCw } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import { RankProgressionChart } from '../components/RankProgressionChart';

export function RankProgressionPage() {
  const { state, loadRanks } = useSumoDB();
  const [selectedRikishi, setSelectedRikishi] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get unique rikishi from rank data
  const availableRikishi = useMemo(() => {
    if (!state.ranks) return [];

    const rikishiMap = new Map();
    state.ranks.forEach(rank => {
      const id = rank.rikishiId;
      const name = rank.rikishiName || `Rikishi ${id}`;
      if (!rikishiMap.has(id)) {
        rikishiMap.set(id, {
          id,
          name,
          rankCount: 1,
          latestRank: rank.rank,
          latestBasho: rank.bashoId
        });
      } else {
        const existing = rikishiMap.get(id);
        existing.rankCount++;
        // Update if this rank is more recent (higher basho ID)
        if (rank.bashoId && (!existing.latestBasho || rank.bashoId > existing.latestBasho)) {
          existing.latestRank = rank.rank;
          existing.latestBasho = rank.bashoId;
        }
      }
    });

    return Array.from(rikishiMap.values())
      .filter(rikishi => rikishi.rankCount >= 2) // Only show rikishi with multiple rank records
      .sort((a, b) => b.rankCount - a.rankCount); // Sort by number of records (most data first)
  }, [state.ranks]);

  // Filter rikishi based on search
  const filteredRikishi = useMemo(() => {
    if (!searchTerm) return availableRikishi;
    return availableRikishi.filter(rikishi =>
      rikishi.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableRikishi, searchTerm]);

  const handleImportRanks = async () => {
    setIsLoading(true);
    try {
      // Get some sample rikishi IDs to fetch ranks for
      const rikishi = await SumoApiService.fetchActiveRikishi();
      const rikishiIds = rikishi.map(r => r.id);
      const ranks = await SumoApiService.fetchAllRanks(rikishiIds);
      loadRanks(ranks);
    } catch (error) {
      console.error('Failed to import ranks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 py-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rank Progression</h1>
            <p className="text-gray-600">Track rikishi career trajectories over time</p>
          </div>
        </div>
        <button
          onClick={handleImportRanks}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Ranks
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rikishi</p>
              <p className="text-2xl font-bold text-gray-900">{availableRikishi.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rank Records</p>
              <p className="text-2xl font-bold text-gray-900">{state.ranks?.length || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedRikishi.length}
              </p>
            </div>
            <Search className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Rikishi Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Rikishi</h2>

        <div className="flex flex-col lg:flex-row gap-3 mb-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by rikishi name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="min-w-64">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Select rikishi to compare ({selectedRikishi.length} selected):
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
              {filteredRikishi.map(rikishi => (
                <label
                  key={rikishi.id}
                  className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRikishi.includes(rikishi.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRikishi([...selectedRikishi, rikishi.id]);
                      } else {
                        setSelectedRikishi(selectedRikishi.filter(id => id !== rikishi.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {rikishi.name}
                    <span className="text-xs text-gray-500 ml-1">
                      ({rikishi.rankCount} records, {rikishi.latestRank})
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {selectedRikishi.length > 0 && (
              <button
                onClick={() => setSelectedRikishi([])}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Clear all selections
              </button>
            )}
          </div>
        </div>

        {filteredRikishi.length === 0 && searchTerm && (
          <p className="text-gray-500 text-sm">No rikishi found matching "{searchTerm}"</p>
        )}
      </div>

      {/* Chart Section */}
      {selectedRikishi.length > 0 ? (
        <RankProgressionChart
          rikishiIds={selectedRikishi}
          rikishiData={selectedRikishi.map(id => {
            const rikishi = availableRikishi.find(r => r.id === id);
            return { id, name: rikishi?.name || `Rikishi ${id}` };
          })}
          height={500}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-16">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              {availableRikishi.length === 0 ? 'No Rank Data Available' : 'No Rikishi Selected'}
            </h3>
            <p className="text-gray-400 mb-4">
              {availableRikishi.length === 0
                ? 'Import rank data to see rikishi career progressions'
                : 'Select one or more rikishi from the checkboxes above to view and compare their rank progressions over time'
              }
            </p>
            {availableRikishi.length === 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2 font-medium">Getting Started:</p>
                <ol className="text-sm text-blue-600 text-left max-w-md mx-auto">
                  <li>1. Click "Import Ranks" button above</li>
                  <li>2. Wait for rank data to load (this may take a moment)</li>
                  <li>3. Select a rikishi from the dropdown to view their progression</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Performers Preview */}
      {availableRikishi.length > 0 && selectedRikishi.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rikishi with Most Rank Data</h3>
          <p className="text-sm text-gray-600 mb-4">Click to add to comparison (you can select multiple)</p>
          <div className="grid gap-3">
            {availableRikishi.slice(0, 5).map(rikishi => (
              <div
                key={rikishi.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRikishi([rikishi.id])}
              >
                <div>
                  <p className="font-medium text-gray-800">{rikishi.name}</p>
                  <p className="text-sm text-gray-600">Latest: {rikishi.latestRank}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{rikishi.rankCount} records</p>
                  <p className="text-xs text-gray-500">Click to select</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Rikishi Summary */}
      {selectedRikishi.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Selected Rikishi ({selectedRikishi.length})</h3>
            <button
              onClick={() => setSelectedRikishi([])}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="grid gap-2">
            {selectedRikishi.map((id, index) => {
              const rikishi = availableRikishi.find(r => r.id === id);
              const colors = ['bg-purple-100 text-purple-800', 'bg-blue-100 text-blue-800', 'bg-red-100 text-red-800', 'bg-green-100 text-green-800', 'bg-orange-100 text-orange-800'];
              return (
                <div key={id} className="flex items-center justify-between p-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length].split(' ')[0].replace('100', '500')}`} />
                    <span className="font-medium">{rikishi?.name || `Rikishi ${id}`}</span>
                    <span className="text-sm text-gray-500">({rikishi?.rankCount} records)</span>
                  </div>
                  <button
                    onClick={() => setSelectedRikishi(selectedRikishi.filter(rid => rid !== id))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}