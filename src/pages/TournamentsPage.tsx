import React, { useState } from 'react';
import { Plus, Calendar, Users, Trophy } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { useLanguage } from '../context/LanguageContext';

export function TournamentsPage() {
  const { state, addBasho } = useSumo();
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('basho')}</h1>
            <p className="mt-2 text-gray-600">
              {t('rikishiPageDescription')}
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            {t('addBasho') || 'Create Basho'}
          </button>
        </div>
      </div>

      {state.basho.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.basho.map((basho) => (
            <div key={basho.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {basho.name}
                    </h3>
                    <p className="text-sm text-gray-500">{basho.division}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(basho.startDate).toLocaleDateString()} - {new Date(basho.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {basho.participants.length} participants
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noBashoYet') || 'No basho'}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('getStartedBasho') || 'Get started by creating your first basho.'}
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('addBasho') || 'Create Basho'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}