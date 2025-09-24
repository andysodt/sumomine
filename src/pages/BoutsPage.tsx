import React, { useState } from 'react';
import { Plus, Swords, Calendar, Award } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { useLanguage } from '../context/LanguageContext';

export function BoutsPage() {
  const { state } = useSumo();
  const { t } = useLanguage();

  const sortedBouts = state.bouts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getRikishiName = (id: string) => {
    const rikishi = state.rikishi.find(r => r.id === id);
    return rikishi?.name || 'Unknown';
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('matches')}</h1>
            <p className="mt-2 text-gray-600">
              Track and record sumo wrestling bouts
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            {t('newBout')}
          </button>
        </div>
      </div>

      {sortedBouts.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sortedBouts.map((bout) => (
              <li key={bout.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Swords className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {getRikishiName(bout.rikishi1Id)}
                          </p>
                          <span className="text-gray-500">{t('vs')}</span>
                          <p className="text-sm font-medium text-gray-900">
                            {getRikishiName(bout.rikishi2Id)}
                          </p>
                        </div>
                        <div className="flex items-center mt-1 space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(bout.date).toLocaleDateString()}
                          </div>
                          {bout.winnerId && (
                            <div className="flex items-center text-sm text-green-600">
                              <Award className="h-4 w-4 mr-1" />
                              {t('winner')}: {getRikishiName(bout.winnerId)}
                            </div>
                          )}
                          {bout.kimarite && (
                            <div className="text-sm text-gray-500">
                              {bout.kimarite}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-red-600 hover:text-red-500 text-sm font-medium">
                        {t('edit')}
                      </button>
                      <button className="text-gray-400 hover:text-red-600 text-sm font-medium">
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <Swords className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noBoutsYet')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('getStartedBouts')}
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('newBout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}