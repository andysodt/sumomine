import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users, Download, Loader2 } from 'lucide-react';
import { useSumoDB } from '../context/SumoContextDB';
import { WrestlerForm } from '../components/WrestlerForm';
import { SumoApiService } from '../services/sumoApi';
import type { Rikishi } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function WrestlersPageDB() {
  const { state, addRikishi, bulkAddRikishi, updateRikishi, deleteRikishi } = useSumoDB();
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

  const handleSubmit = async (rikishi: Rikishi) => {
    try {
      if (editingRikishi) {
        await updateRikishi(rikishi);
      } else {
        await addRikishi(rikishi);
      }
      setShowForm(false);
      setEditingRikishi(undefined);
    } catch (error) {
      console.error('Error saving rikishi:', error);
      // Error is already handled in the context
    }
  };

  const handleEdit = (rikishi: Rikishi) => {
    setEditingRikishi(rikishi);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteRikishi(id);
      } catch (error) {
        console.error('Error deleting rikishi:', error);
        // Error is already handled in the context
      }
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
      const allRikishi = await SumoApiService.fetchRikishi();

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

      // Use bulk insert for better performance
      await bulkAddRikishi(newRikishi);

      setImportStats({
        added: newRikishi.length,
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

  // Show loading spinner when loading
  if (state.loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-jpblue-600" />
          <p className="text-gray-600">Loading rikishi data...</p>
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (state.error) {
    return (
      <div className="animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{state.error}</p>
                <p className="mt-2">Please ensure the backend server is running at http://localhost:3001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-600 to-jpblue-700 bg-clip-text text-transparent">{t('rikishiPageTitle')}</h1>
              <p className="mt-2 text-gray-600">
                {t('rikishiPageDescription')} - Database: {state.rikishi.length} records
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleImportRikishi}
              disabled={isImporting}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('addRikishi')}
            </button>
          </div>
        </div>

        {/* Import Stats */}
        {importStats && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Import Completed Successfully!</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>Added {importStats.added} new rikishi to the database, skipped {importStats.skipped} duplicates. Total processed: {importStats.total}</p>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {uniqueRanks.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rikishi Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredRikishi.map((rikishi) => (
            <li key={rikishi.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-jpblue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-jpblue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {rikishi.name}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rikishi.rank === 'Yokozuna' ? 'bg-purple-100 text-purple-800' :
                          rikishi.rank === 'Ozeki' ? 'bg-red-100 text-red-800' :
                          rikishi.rank === 'Sekiwake' || rikishi.rank === 'Komusubi' ? 'bg-orange-100 text-orange-800' :
                          rikishi.rank === 'Maegashira' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rikishi.rank}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{rikishi.stable}</span>
                        <span>{rikishi.height}cm / {rikishi.weight}kg</span>
                        <span>Win Rate: {getWinRate(rikishi.wins, rikishi.losses)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(rikishi)}
                    className="p-2 text-jpblue-600 hover:text-jpblue-700 hover:bg-jpblue-50 rounded-md transition-colors"
                    title={t('editRikishi')}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rikishi.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title={t('deleteRikishi')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filteredRikishi.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rikishi found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {state.rikishi.length === 0
              ? 'Get started by importing rikishi data or adding a new rikishi.'
              : 'Try adjusting your search criteria.'}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <WrestlerForm
              wrestler={editingRikishi}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}