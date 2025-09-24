import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { WrestlerForm } from '../components/WrestlerForm';
import { Rikishi } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function WrestlersPage() {
  const { state, addRikishi, updateRikishi, deleteRikishi } = useSumo();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingRikishi, setEditingRikishi] = useState<Rikishi | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('');

  const filteredRikishi = state.rikishi.filter(rikishi => {
    const matchesSearch = rikishi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rikishi.stable.toLowerCase().includes(searchTerm.toLowerCase());
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

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  };

  const uniqueRanks = [...new Set(state.rikishi.map(r => r.rank))];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpred-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpred-600 to-jpred-700 bg-clip-text text-transparent">{t('rikishiPageTitle')}</h1>
              <p className="mt-2 text-gray-600">
                {t('rikishiPageDescription')}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-jpblue-600 to-jpblue-700 hover:from-jpblue-700 hover:to-jpblue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpblue-500 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('addRikishi')}
            </button>
          </div>
        </div>

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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRikishi.map((rikishi, index) => (
            <div
              key={rikishi.id}
              className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-jpred transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-jpred-500 to-jpblue-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">相</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-jpred-700 transition-colors">
                          {rikishi.name}
                        </h3>
                        <p className="text-sm font-medium text-jpred-600">{rikishi.rank}</p>
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
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
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
                </div>

                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-jpred-500 to-jpblue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
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
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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