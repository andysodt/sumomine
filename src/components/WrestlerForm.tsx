import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Rikishi, SumoRank } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RikishiFormProps {
  wrestler?: Rikishi;
  onSubmit: (wrestler: Rikishi) => void;
  onCancel: () => void;
}

const sumoRanks: SumoRank[] = [
  'Yokozuna',
  'Ozeki',
  'Sekiwake',
  'Komusubi',
  'Maegashira',
  'Juryo',
  'Makushita',
  'Sandanme',
  'Jonidan',
  'Jonokuchi',
];

export function WrestlerForm({ wrestler, onSubmit, onCancel }: RikishiFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: wrestler?.name || '',
    rank: wrestler?.rank || 'Maegashira' as SumoRank,
    stable: wrestler?.stable || '',
    weight: wrestler?.weight || 0,
    height: wrestler?.height || 0,
    birthDate: wrestler?.birthDate || '',
    debut: wrestler?.debut || '',
    wins: wrestler?.wins || 0,
    losses: wrestler?.losses || 0,
    draws: wrestler?.draws || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rikishiData: Rikishi = {
      id: wrestler?.id || crypto.randomUUID(),
      ...formData,
    };

    onSubmit(rikishiData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm animate-fade-in">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm border-gray-200 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-jpred-600 to-jpblue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">相</span>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-jpred-600 to-jpblue-600 bg-clip-text text-transparent">
              {wrestler ? t('editRikishi') : t('addNewRikishi')}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('name')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
                {t('rank')}
              </label>
              <select
                id="rank"
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              >
                {sumoRanks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stable" className="block text-sm font-medium text-gray-700">
                {t('stable')}
              </label>
              <input
                type="text"
                id="stable"
                name="stable"
                required
                value={formData.stable}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                {t('weightKg')}
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                min="0"
                required
                value={formData.weight}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                {t('heightCm')}
              </label>
              <input
                type="number"
                id="height"
                name="height"
                min="0"
                required
                value={formData.height}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                {t('birthDate')}
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="debut" className="block text-sm font-medium text-gray-700">
                {t('debutDate')}
              </label>
              <input
                type="date"
                id="debut"
                name="debut"
                required
                value={formData.debut}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="wins" className="block text-sm font-medium text-gray-700">
                {t('wins')}
              </label>
              <input
                type="number"
                id="wins"
                name="wins"
                min="0"
                value={formData.wins}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="losses" className="block text-sm font-medium text-gray-700">
                {t('losses')}
              </label>
              <input
                type="number"
                id="losses"
                name="losses"
                min="0"
                value={formData.losses}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>

            <div>
              <label htmlFor="draws" className="block text-sm font-medium text-gray-700">
                {t('draws')}
              </label>
              <input
                type="number"
                id="draws"
                name="draws"
                min="0"
                value={formData.draws}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-jpred-500 focus:border-jpred-500 transition-all duration-200 hover:border-jpred-300"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpred-500 transition-all duration-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-jpred-600 to-jpblue-600 hover:from-jpred-700 hover:to-jpblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jpred-500 transition-all duration-200 transform hover:scale-105"
            >
              {wrestler ? t('updateRikishi') : t('createRikishi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}