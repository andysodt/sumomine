import React, { useState, useMemo } from 'react';
import { Users, Calendar, Search, Download, RefreshCw } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { SumoApiService } from '../services/sumoApi';
import type { ShikonaEntity } from '../types';

export function ShikonasPage() {
  const { state, loadShikonas } = useSumo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'shikonaEn' | 'shikonaJp'>('year');
  const [isLoading, setIsLoading] = useState(false);

  const years = useMemo(() => {
    if (!state.shikonas) return [];
    const yearSet = new Set(state.shikonas.map(shikona => shikona.year).filter(Boolean));
    return Array.from(yearSet).sort((a, b) => (b || 0) - (a || 0));
  }, [state.shikonas]);

  const filteredAndSortedShikonas = useMemo(() => {
    if (!state.shikonas) return [];
    let filtered = state.shikonas.filter(shikona => {
      const matchesSearch = shikona.rikishiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shikona.shikonaEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shikona.shikonaJp.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === 'all' || shikona.year?.toString() === selectedYear;
      return matchesSearch && matchesYear;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.rikishiName || '').localeCompare(b.rikishiName || '');
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'shikonaEn':
          return a.shikonaEn.localeCompare(b.shikonaEn);
        case 'shikonaJp':
          return a.shikonaJp.localeCompare(b.shikonaJp);
        default:
          return 0;
      }
    });
  }, [state.shikonas, searchTerm, selectedYear, sortBy]);

  const stats = useMemo(() => {
    const totalShikonas = state.shikonas?.length || 0;
    const yearCounts = years.reduce((acc, year) => {
      if (year) {
        acc[year] = state.shikonas?.filter(shikona => shikona.year === year).length || 0;
      }
      return acc;
    }, {} as Record<number, number>);

    const withEnglishName = state.shikonas?.filter(shikona => shikona.shikonaEn.trim().length > 0).length || 0;
    const withJapaneseName = state.shikonas?.filter(shikona => shikona.shikonaJp.trim().length > 0).length || 0;

    return {
      total: totalShikonas,
      years: yearCounts,
      withEnglish: withEnglishName,
      withJapanese: withJapaneseName
    };
  }, [state.shikonas, years]);

  const handleImportShikonas = async () => {
    setIsLoading(true);
    try {
      // Get some sample rikishi IDs to fetch shikonas for
      const rikishi = await SumoApiService.fetchActiveRikishi();
      const rikishiIds = rikishi.slice(0, 10).map(r => r.id); // Limit to first 10 for demo
      const shikonas = await SumoApiService.fetchAllShikonas(rikishiIds);
      loadShikonas(shikonas);
    } catch (error) {
      console.error('Failed to import shikonas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getYearColor = (year?: number) => {
    if (!year) return 'text-gray-600';

    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - year;

    if (yearDiff <= 1) return 'text-green-600';
    if (yearDiff <= 3) return 'text-blue-600';
    if (yearDiff <= 5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const formatDate = (shikona: ShikonaEntity) => {
    if (shikona.year && shikona.month) {
      return `${shikona.year}/${String(shikona.month).padStart(2, '0')}`;
    }
    return shikona.bashoId || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Shikonas</h1>
        </div>
        <button
          onClick={handleImportShikonas}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Shikonas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shikonas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With English Names</p>
              <p className="text-2xl font-bold text-green-600">{stats.withEnglish}</p>
            </div>
            <span className="text-2xl">🇺🇸</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Japanese Names</p>
              <p className="text-2xl font-bold text-red-600">{stats.withJapanese}</p>
            </div>
            <span className="text-2xl">🇯🇵</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Recent Years</p>
            <div className="space-y-1">
              {Object.entries(stats.years).slice(0, 3).map(([year, count]) => (
                <div key={year} className="flex justify-between text-sm">
                  <span className="text-gray-600">{year}</span>
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
                placeholder="Search by rikishi name or shikona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year?.toString()}>{year}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'year' | 'shikonaEn' | 'shikonaJp')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="year">Sort by Year</option>
            <option value="name">Sort by Rikishi Name</option>
            <option value="shikonaEn">Sort by English Shikona</option>
            <option value="shikonaJp">Sort by Japanese Shikona</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rikishi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">English Shikona</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Japanese Shikona</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Basho</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedShikonas.map((shikona) => (
                <tr key={shikona.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {shikona.rikishiName || `Rikishi ${shikona.rikishiId}`}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-indigo-600">
                      {shikona.shikonaEn || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-700">
                      {shikona.shikonaJp || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm font-medium ${getYearColor(shikona.year)}`}>
                        {formatDate(shikona)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{shikona.bashoId}</td>
                </tr>
              ))}
              {filteredAndSortedShikonas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                    {(state.shikonas?.length || 0) === 0 ? 'No shikonas data available. Import shikonas to get started.' : 'No shikonas match your search criteria.'}
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