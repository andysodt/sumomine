import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users, Download, Loader2 } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { WrestlerForm } from '../components/WrestlerForm';
import { SumoApiService } from '../services/sumoApi';
import type { Rikishi } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function WrestlersPage() {
  const { state, addRikishi, updateRikishi, deleteRikishi } = useSumoDB();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingRikishi, setEditingRikishi] = useState<Rikishi | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    added: number;
    skipped: number;
    total: number;
  } | null>(null);

  const filteredRikishi = state.rikishi.filter(rikishi => {
    const matchesSearch = rikishi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rikishi.stable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rikishi.shikonaEn && rikishi.shikonaEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (rikishi.shikonaJp && rikishi.shikonaJp.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (rikishi.shusshin && rikishi.shusshin.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (rikishi.heya && rikishi.heya.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRank = filterRank === '' || rikishi.rank === filterRank;
    return matchesSearch && matchesRank;
  });

  const handleSubmit = (rikishi: Rikishi) => {
    if (editingRikishi) {
      updateRikishi(rikishi);
    } else {
      addRikishi(rikishi);
    }
    setShowForm(false);
    setEditingRikishi(undefined);
  };

  const handleEdit = (rikishi: Rikishi) => {
    setEditingRikishi(rikishi);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      deleteRikishi(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRikishi(undefined);
  };

  const handleImportRikishi = async () => {
    if (!window.confirm('This will import all 9,101 rikishi from the Sumo API. Continue?')) {
      return;
    }

    setIsImporting(true);
    setImportStats(null);

    try {
      // Fetch all rikishi from the API
      const allRikishi = await SumoApiService.fetchRikishi(true);

      if (!allRikishi || allRikishi.length === 0) {
        throw new Error('No rikishi data received from API');
      }

      // Convert to internal format
      const rikishi = SumoApiService.convertToRikishi(allRikishi);

      if (!rikishi || rikishi.length === 0) {
        throw new Error('Failed to convert rikishi data');
      }

      // Filter out duplicates based on ID
      const existingRikishi = state.rikishi;
      const newRikishi = rikishi.filter(r =>
        !existingRikishi.some(existing => existing.id === r.id)
      );

      // Add new rikishi to the system
      let addedCount = 0;
      const batchSize = 100; // Process in batches

      for (let i = 0; i < newRikishi.length; i += batchSize) {
        const batch = newRikishi.slice(i, i + batchSize);

        batch.forEach(r => {
          try {
            addRikishi(r);
            addedCount++;
          } catch (error) {
            console.error(`Failed to add rikishi ${r.name}:`, error);
          }
        });

        // Small delay between batches to keep UI responsive
        if (i + batchSize < newRikishi.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setImportStats({
        added: addedCount,
        skipped: rikishi.length - newRikishi.length,
        total: rikishi.length
      });

    } catch (error) {
      console.error('Failed to import rikishi:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  };

  const uniqueRanks = [...new Set(state.rikishi.map(r => r.rank))];

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-600 to-jpblue-700 bg-clip-text text-transparent">{t('rikishiPageTitle')}</h1>
              <p className="mt-2 text-gray-600">
                {t('rikishiPageDescription')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleImportRikishi}
              disabled={isImporting}
              className="inline-flex items-center px-3 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isImporting ? (
                <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Download className="-ml-1 mr-2 h-5 w-5" />
              )}
              {isImporting ? 'Importing...' : 'Import All Rikishi'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-3 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('addRikishi')}
            </button>
          </div>
        </div>

        {/* Import Stats */}
        {importStats && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Import Completed Successfully!</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>Added {importStats.added} new rikishi, skipped {importStats.skipped} duplicates. Total processed: {importStats.total}</p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setImportStats(null)}
                    className="text-sm text-green-600 hover:text-green-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchRikishi')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-jpblue-500 focus:border-jpblue-500"
            />
          </div>
          <div>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-jpblue-500 focus:border-jpblue-500 rounded-md"
            >
              <option value="">{t('allRanks')}</option>
              {uniqueRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Wrestlers Grid */}
      {filteredRikishi.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRikishi.map((rikishi, index) => (
            <div
              key={rikishi.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpblue transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpblue-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">相</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpblue-700 transition-colors">
                          {rikishi.name}
                        </h3>
                        <p className="text-sm font-medium text-jpblue-600">{rikishi.rank}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 ml-13">{rikishi.stable}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(rikishi)}
                      className="p-2 text-gray-400 hover:text-jpblue-600 hover:bg-jpblue-50 rounded-lg transition-all duration-200"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rikishi.id)}
                      className="p-2 text-gray-400 hover:text-jpblue-600 hover:bg-jpblue-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('record')}:</span>
                    <span className="font-medium">
                      {rikishi.wins}-{rikishi.losses}-{rikishi.draws}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('winRate')}:</span>
                    <span className="font-medium">
                      {getWinRate(rikishi.wins, rikishi.losses)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('weight')}:</span>
                    <span className="font-medium">{rikishi.weight} {t('kg')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('height')}:</span>
                    <span className="font-medium">{rikishi.height} {t('cm')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('debut')}:</span>
                    <span className="font-medium">
                      {new Date(rikishi.debut).toLocaleDateString()}
                    </span>
                  </div>
                  {rikishi.shikonaJp && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shikona (JP):</span>
                      <span className="font-medium">{rikishi.shikonaJp}</span>
                    </div>
                  )}
                  {rikishi.currentRank && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Rank:</span>
                      <span className="font-medium text-jpblue-600">{rikishi.currentRank}</span>
                    </div>
                  )}
                  {rikishi.shusshin && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Birthplace:</span>
                      <span className="font-medium">{rikishi.shusshin}</span>
                    </div>
                  )}
                  {rikishi.heya && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Heya:</span>
                      <span className="font-medium">{rikishi.heya}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-jpblue-500 to-jpblue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{
                        width: `${getWinRate(rikishi.wins, rikishi.losses)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Plus className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterRank ? t('noRikishiFound') : t('noRikishiYet')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterRank
              ? t('adjustSearchCriteria')
              : t('getStartedRikishi')}
          </p>
          {!searchTerm && !filterRank && (
            <div className="mt-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                {t('addRikishi')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <WrestlerForm
          wrestler={editingRikishi}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}