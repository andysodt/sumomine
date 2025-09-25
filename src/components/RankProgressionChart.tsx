import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import type { RankEntity } from '../types';

interface RankProgressionChartProps {
  rikishiIds?: string[];
  rikishiData?: { id: string; name: string }[];
  height?: number;
}

interface ChartDataPoint {
  date: string;
  basho: string;
  year: number;
  month: number;
  [key: string]: any; // Dynamic properties for each rikishi's rank data
}

export function RankProgressionChart({ rikishiIds = [], rikishiData = [], height = 400 }: RankProgressionChartProps) {
  const { state } = useSumoDB();

  // Convert rank to numerical value for chart (lower numbers = higher ranks)
  const getRankValue = (rank: string) => {
    // Yokozuna = 1, Ozeki = 2, etc.
    if (rank.includes('Yokozuna')) return 1;
    if (rank.includes('Ozeki')) return 2;
    if (rank.includes('Sekiwake')) return 3;
    if (rank.includes('Komusubi')) return 4;
    if (rank.includes('Maegashira')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 17;
      return 4 + number; // Start after Komusubi
    }
    if (rank.includes('Juryo')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 14;
      return 20 + number; // Start after Makuuchi
    }
    if (rank.includes('Makushita')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 60;
      return 35 + number; // Start after Juryo
    }
    if (rank.includes('Sandanme')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 100;
      return 95 + number; // Start after Makushita
    }
    if (rank.includes('Jonidan')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 200;
      return 195 + number; // Start after Sandanme
    }
    if (rank.includes('Jonokuchi')) {
      const match = rank.match(/(\d+)/);
      const number = match ? parseInt(match[1]) : 40;
      return 395 + number; // Start after Jonidan
    }
    return 999; // Unknown ranks
  };

  // Process rank data for multiple rikishi
  const chartData = useMemo(() => {
    if (!state.ranks || rikishiIds.length === 0) return [];

    // Get all bashos that have data for any of the selected rikishi
    const allBashos = new Map<string, ChartDataPoint>();

    // Process each rikishi
    rikishiIds.forEach((rikishiId, index) => {
      const rikishiName = rikishiData.find(r => r.id === rikishiId)?.name || `Rikishi ${rikishiId}`;

      // Filter ranks for this specific rikishi
      const rikishiRanks = state.ranks.filter(rank => rank.rikishiId === rikishiId);

      rikishiRanks.forEach(rank => {
        const year = rank.year || parseInt(rank.bashoId?.substring(0, 4) || '0');
        const month = rank.month || parseInt(rank.bashoId?.substring(4, 6) || '0');

        // Create a sortable date string
        const dateStr = `${year}-${String(month).padStart(2, '0')}`;

        // Get season name
        const seasonNames: { [key: number]: string } = {
          1: 'Hatsu', 3: 'Haru', 5: 'Natsu', 7: 'Nagoya', 9: 'Aki', 11: 'Kyushu'
        };
        const bashoName = `${seasonNames[month] || 'Unknown'} ${year}`;

        // Initialize basho entry if it doesn't exist
        if (!allBashos.has(dateStr)) {
          allBashos.set(dateStr, {
            date: dateStr,
            basho: bashoName,
            year,
            month
          });
        }

        // Add this rikishi's rank data to the basho
        const bashoData = allBashos.get(dateStr)!;
        bashoData[`${rikishiName}_rank`] = getRankValue(rank.rank);
        bashoData[`${rikishiName}_rankDisplay`] = rank.rank;
        bashoData[`${rikishiName}_division`] = rank.division || 'Unknown';
      });
    });

    // Convert to array and sort by date
    return Array.from(allBashos.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [state.ranks, rikishiIds, rikishiData]);

  // Get color for each rikishi line (using a color palette)
  const getColorPalette = () => {
    return [
      '#7c3aed', // purple
      '#2563eb', // blue
      '#dc2626', // red
      '#16a34a', // green
      '#ea580c', // orange
      '#ca8a04', // yellow
      '#be185d', // pink
      '#0891b2', // cyan
      '#7c2d12', // brown
      '#374151', // gray
    ];
  };

  const colors = getColorPalette();

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800 mb-2">{data.basho}</p>
          {rikishiData.map((rikishi, index) => {
            const rankDisplay = data[`${rikishi.name}_rankDisplay`];
            const division = data[`${rikishi.name}_division`];
            if (!rankDisplay) return null;

            return (
              <div key={rikishi.id} className="flex items-center gap-2 text-sm mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="font-medium">{rikishi.name}:</span>
                <span className="text-gray-600">{rankDisplay}</span>
                {division && <span className="text-xs text-gray-500">({division})</span>}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis labels to show actual ranks
  const formatYAxisLabel = (value: number) => {
    if (value <= 1) return 'Yokozuna';
    if (value <= 2) return 'Ozeki';
    if (value <= 3) return 'Sekiwake';
    if (value <= 4) return 'Komusubi';
    if (value <= 21) return `M${Math.round(value - 4)}`;
    if (value <= 35) return `J${Math.round(value - 20)}`;
    if (value <= 95) return `Ms${Math.round(value - 35)}`;
    if (value <= 195) return `Sd${Math.round(value - 95)}`;
    if (value <= 395) return `Jd${Math.round(value - 195)}`;
    if (value <= 435) return `Jk${Math.round(value - 395)}`;
    return '?';
  };

  // Calculate stats for multiple rikishi
  const stats = useMemo(() => {
    if (chartData.length === 0 || rikishiIds.length === 0) return null;

    const rikishiStats = rikishiData.map((rikishi, index) => {
      const rikishiDataPoints = chartData.filter(point => point[`${rikishi.name}_rank`] !== undefined);
      if (rikishiDataPoints.length === 0) return null;

      const first = rikishiDataPoints[0];
      const last = rikishiDataPoints[rikishiDataPoints.length - 1];
      const highestRank = rikishiDataPoints.reduce((min, curr) =>
        curr[`${rikishi.name}_rank`] < min ? curr[`${rikishi.name}_rank`] : min, 999);
      const highestRankDisplay = rikishiDataPoints.find(point =>
        point[`${rikishi.name}_rank`] === highestRank)?.[`${rikishi.name}_rankDisplay`] || '?';

      const firstRankValue = first[`${rikishi.name}_rank`];
      const lastRankValue = last[`${rikishi.name}_rank`];
      const trend = rikishiDataPoints.length >= 2 ?
        (lastRankValue < firstRankValue ? 'rising' : lastRankValue > firstRankValue ? 'falling' : 'stable') : 'stable';

      return {
        rikishi,
        color: colors[index % colors.length],
        totalBashos: rikishiDataPoints.length,
        firstRank: first[`${rikishi.name}_rankDisplay`],
        currentRank: last[`${rikishi.name}_rankDisplay`],
        highestRank: highestRankDisplay,
        trend,
        improvement: firstRankValue - lastRankValue // Positive = improvement (lower rank value)
      };
    }).filter(Boolean);

    return {
      totalBashos: chartData.length,
      rikishiCount: rikishiIds.length,
      rikishiStats
    };
  }, [chartData, rikishiIds, rikishiData, colors]);

  if (!chartData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <Award className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Rank Progression</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <p>No rank data available for this rikishi</p>
          <p className="text-sm mt-1">Import rank data to see progression chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Rank Progression - {rikishiIds.length === 1
              ? rikishiData[0]?.name || `Rikishi ${rikishiIds[0]}`
              : `${rikishiIds.length} Rikishi Comparison`
            }
          </h3>
        </div>
        {stats && rikishiIds.length === 1 && stats.rikishiStats?.[0] && (
          <div className="flex items-center gap-2 text-sm">
            {stats.rikishiStats[0].trend === 'rising' && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>Rising</span>
              </div>
            )}
            {stats.rikishiStats[0].trend === 'falling' && (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span>Declining</span>
              </div>
            )}
          </div>
        )}
      </div>

      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-600">Total Bashos</p>
              <p className="text-lg font-semibold text-gray-800">{stats.totalBashos}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Rikishi</p>
              <p className="text-lg font-semibold text-blue-600">{stats.rikishiCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Data Points</p>
              <p className="text-lg font-semibold text-purple-600">
                {stats.rikishiStats?.reduce((total, stat) => total + stat.totalBashos, 0) || 0}
              </p>
            </div>
          </div>

          {/* Individual rikishi stats */}
          {stats.rikishiStats && stats.rikishiStats.length > 0 && (
            <div className="space-y-3">
              {stats.rikishiStats.map((stat, index) => (
                <div key={stat.rikishi.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="font-medium text-gray-800">{stat.rikishi.name}</span>
                    <div className="flex items-center gap-1 text-xs">
                      {stat.trend === 'rising' && (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      )}
                      {stat.trend === 'falling' && (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`${
                        stat.trend === 'rising' ? 'text-green-600' :
                        stat.trend === 'falling' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Highest</p>
                      <p className="font-medium">{stat.highestRank}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Current</p>
                      <p className="font-medium">{stat.currentRank}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Bashos</p>
                      <p className="font-medium">{stat.totalBashos}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="basho"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={formatYAxisLabel}
              reversed={true} // Lower rank values (better ranks) at top
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {rikishiData.map((rikishi, index) => (
              <Line
                key={rikishi.id}
                type="monotone"
                dataKey={`${rikishi.name}_rank`}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2, fill: 'white' }}
                name={rikishi.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Lower positions on the chart indicate higher sumo ranks</p>
        <p>Y-axis: Y = Yokozuna, O = Ozeki, S = Sekiwake, K = Komusubi, M = Maegashira, J = Juryo, Ms = Makushita, Sd = Sandanme, Jd = Jonidan, Jk = Jonokuchi</p>
      </div>
    </div>
  );
}