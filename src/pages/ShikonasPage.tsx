import { useState, useMemo } from 'react';
import { Users, Calendar, Search, Download, RefreshCw, Globe, Type, Star, Award, BookOpen, TrendingUp, Hash, Flag } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { SumoApiService } from '../services/sumoApi';
import type { ShikonaEntity } from '../types';

export function ShikonasPage() {
  const { state, loadShikonas } = useSumoDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedNameType, setSelectedNameType] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'shikonaEn' | 'shikonaJp' | 'nameLength' | 'complexity' | 'popularity' | 'nameHistory'>('year');
  const [isLoading, setIsLoading] = useState(false);

  const years = useMemo(() => {
    if (!state.shikonas) return [];
    const yearSet = new Set(state.shikonas.map(shikona => shikona.year).filter(Boolean));
    return Array.from(yearSet).sort((a, b) => (b || 0) - (a || 0));
  }, [state.shikonas]);

  const nameTypes = useMemo(() => {
    if (!state.shikonas) return [];
    const nameTypeSet = new Set(state.shikonas.map(shikona => shikona.nameType).filter(Boolean));
    return Array.from(nameTypeSet).sort();
  }, [state.shikonas]);

  const origins = useMemo(() => {
    if (!state.shikonas) return [];
    const originSet = new Set(state.shikonas.map(shikona => shikona.nameOrigin).filter(Boolean));
    return Array.from(originSet).sort();
  }, [state.shikonas]);

  const filteredAndSortedShikonas = useMemo(() => {
    if (!state.shikonas) return [];
    const filtered = state.shikonas.filter(shikona => {
      const matchesSearch = shikona.rikishiName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shikona.shikonaEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shikona.shikonaJp.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === 'all' || shikona.year?.toString() === selectedYear;
      const matchesNameType = selectedNameType === 'all' || shikona.nameType === selectedNameType;
      const matchesOrigin = selectedOrigin === 'all' || shikona.nameOrigin === selectedOrigin;
      return matchesSearch && matchesYear && matchesNameType && matchesOrigin;
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
        case 'nameLength': {
          const aLength = (a.nameLength?.total || 0);
          const bLength = (b.nameLength?.total || 0);
          return bLength - aLength;
        }
        case 'complexity': {
          const complexityOrder = { 'Complex': 3, 'Moderate': 2, 'Simple': 1 };
          return (complexityOrder[b.nameComplexity || 'Simple'] || 0) - (complexityOrder[a.nameComplexity || 'Simple'] || 0);
        }
        case 'popularity': {
          const popularityOrder = { 'Very Common': 4, 'Common': 3, 'Uncommon': 2, 'Unique': 1 };
          return (popularityOrder[b.namePopularity || 'Unique'] || 0) - (popularityOrder[a.namePopularity || 'Unique'] || 0);
        }
        case 'nameHistory':
          return (b.nameChangeNumber || 0) - (a.nameChangeNumber || 0);
        default:
          return 0;
      }
    });
  }, [state.shikonas, searchTerm, selectedYear, selectedNameType, selectedOrigin, sortBy]);

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

    const withKanji = state.shikonas?.filter(shikona => shikona.hasKanji).length || 0;
    const withHiragana = state.shikonas?.filter(shikona => shikona.hasHiragana).length || 0;
    const withKatakana = state.shikonas?.filter(shikona => shikona.hasKatakana).length || 0;

    const complexNames = state.shikonas?.filter(shikona => shikona.nameComplexity === 'Complex').length || 0;
    const traditionalNames = state.shikonas?.filter(shikona => shikona.nameOrigin === 'Traditional Japanese').length || 0;

    return {
      total: totalShikonas,
      years: yearCounts,
      withEnglish: withEnglishName,
      withJapanese: withJapaneseName,
      withKanji,
      withHiragana,
      withKatakana,
      complexNames,
      traditionalNames
    };
  }, [state.shikonas, years]);

  const handleImportShikonas = async () => {
    setIsLoading(true);
    try {
      // Get sample rikishi IDs to fetch shikonas for - using a broader range
      const rikishiIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // Top 20 rikishi IDs
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

  const getNameTypeIcon = (nameType?: string) => {
    switch (nameType) {
      case 'Both': return <Globe className="h-4 w-4 text-green-500" />;
      case 'English Only': return <span className="text-xs">🇺🇸</span>;
      case 'Japanese Only': return <span className="text-xs">🇯🇵</span>;
      default: return <Type className="h-4 w-4 text-gray-400" />;
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'Complex': return 'text-red-600 bg-red-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      case 'Simple': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOriginColor = (origin?: string) => {
    switch (origin) {
      case 'Traditional Japanese': return 'text-jpblue-600 bg-jpblue-50';
      case 'Modern Japanese': return 'text-blue-600 bg-blue-50';
      case 'Foreign': return 'text-purple-600 bg-purple-50';
      case 'Mixed': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPopularityIcon = (popularity?: string) => {
    switch (popularity) {
      case 'Very Common': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'Common': return <Award className="h-3 w-3 text-orange-500" />;
      case 'Uncommon': return <Star className="h-3 w-3 text-blue-500" />;
      case 'Unique': return <BookOpen className="h-3 w-3 text-purple-500" />;
      default: return <Hash className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'Current': return 'text-green-600';
      case 'Recent': return 'text-blue-600';
      case 'Historic': return 'text-orange-600';
      default: return 'text-gray-600';
    }
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
          <Users className="h-8 w-8 text-jpblue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Shikonas</h1>
        </div>
        <button
          onClick={handleImportShikonas}
          disabled={isLoading}
          className="flex items-center gap-2 bg-jpblue-600 text-white px-4 py-2 rounded-lg hover:bg-jpblue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Import Shikonas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shikonas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-jpblue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Kanji</p>
              <p className="text-2xl font-bold text-jpblue-600">{stats.withKanji}</p>
            </div>
            <span className="text-2xl">漢</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Hiragana</p>
              <p className="text-2xl font-bold text-pink-600">{stats.withHiragana}</p>
            </div>
            <span className="text-2xl">あ</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Katakana</p>
              <p className="text-2xl font-bold text-blue-600">{stats.withKatakana}</p>
            </div>
            <span className="text-2xl">ア</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Complex Names</p>
              <p className="text-2xl font-bold text-red-600">{stats.complexNames}</p>
            </div>
            <Type className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Traditional</p>
              <p className="text-2xl font-bold text-jpblue-600">{stats.traditionalNames}</p>
            </div>
            <Flag className="h-8 w-8 text-jpblue-600" />
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
              />
            </div>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year?.toString()}>{year}</option>
            ))}
          </select>

          <select
            value={selectedNameType}
            onChange={(e) => setSelectedNameType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Name Types</option>
            {nameTypes.map(nameType => (
              <option key={nameType} value={nameType}>{nameType}</option>
            ))}
          </select>

          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="all">All Origins</option>
            {origins.map(origin => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'year' | 'shikonaEn' | 'shikonaJp' | 'nameLength' | 'complexity' | 'popularity' | 'nameHistory')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jpblue-500 focus:border-jpblue-500"
          >
            <option value="year">Sort by Year</option>
            <option value="name">Sort by Rikishi Name</option>
            <option value="shikonaEn">Sort by English Shikona</option>
            <option value="shikonaJp">Sort by Japanese Shikona</option>
            <option value="nameLength">Sort by Name Length</option>
            <option value="complexity">Sort by Complexity</option>
            <option value="popularity">Sort by Popularity</option>
            <option value="nameHistory">Sort by Name Changes</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rikishi ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">English Shikona</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Japanese Shikona</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Basho ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Complexity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Origin</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Popularity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Season</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedShikonas.map((shikona) => (
                <tr key={shikona.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-gray-900">
                      {shikona.id}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-jpblue-600">
                      {shikona.rikishiId}
                    </div>
                    {shikona.nameChangeNumber && shikona.nameChangeNumber > 1 && (
                      <div className="text-xs text-gray-500">
                        Name #{shikona.nameChangeNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-jpblue-600">
                      {shikona.shikonaEn || '-'}
                    </span>
                    {shikona.nameLength?.english && (
                      <div className="text-xs text-gray-500">
                        {shikona.nameLength.english} chars
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-700">
                      {shikona.shikonaJp || '-'}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {shikona.hasKanji && <span className="text-xs text-jpblue-600">漢</span>}
                      {shikona.hasHiragana && <span className="text-xs text-pink-600">あ</span>}
                      {shikona.hasKatakana && <span className="text-xs text-blue-600">ア</span>}
                      {shikona.nameLength?.japanese && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({shikona.nameLength.japanese})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-gray-900">
                      {shikona.bashoId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shikona.year}/{String(shikona.month).padStart(2, '0')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getNameTypeIcon(shikona.nameType)}
                      <span className="text-sm text-gray-600">{shikona.nameType || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {shikona.nameComplexity && (
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${getComplexityColor(shikona.nameComplexity)}`}>
                        {shikona.nameComplexity}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {shikona.nameOrigin && (
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${getOriginColor(shikona.nameOrigin)}`}>
                        {shikona.nameOrigin}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getPopularityIcon(shikona.namePopularity)}
                      <span className="text-xs text-gray-600">{shikona.namePopularity || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{shikona.seasonName || formatDate(shikona)}</span>
                    </div>
                    {shikona.year && (
                      <div className="text-xs text-gray-500">
                        {shikona.year}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedShikonas.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-gray-500">
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