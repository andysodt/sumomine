import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Swords, BarChart3, Plus, Database } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { useLanguage } from '../context/LanguageContext';
import { ComprehensiveImport } from '../components/ComprehensiveImport';

export function Dashboard() {
  const { state } = useSumo();
  const { t } = useLanguage();

  const stats = [
    {
      name: t('totalRikishi'),
      value: state.rikishi.length,
      icon: Users,
      color: 'bg-blue-500',
      href: '/rikishi',
    },
    {
      name: t('activeBasho'),
      value: state.basho.length,
      icon: Trophy,
      color: 'bg-green-500',
      href: '/basho',
    },
    {
      name: t('totalBouts'),
      value: state.bouts.length,
      icon: Swords,
      color: 'bg-red-500',
      href: '/bouts',
    },
    {
      name: t('avgWinRate'),
      value: state.bouts.length > 0 ? '50%' : '0%',
      icon: BarChart3,
      color: 'bg-purple-500',
      href: '/statistics',
    },
  ];

  const recentBouts = state.bouts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topRikishi = state.rikishi
    .sort((a, b) => (b.wins / Math.max(b.wins + b.losses, 1)) - (a.wins / Math.max(a.wins + a.losses, 1)))
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-jpblue-600 to-jpblue-800 rounded-xl flex items-center justify-center shadow-jpblue animate-pulse-slow">
              <span className="text-white font-bold text-2xl">相</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-jpblue-600 via-jpblue-700 to-jpblue-800 bg-clip-text text-transparent">{t('dashboard')}</h1>
              <p className="mt-2 text-gray-600">
                {t('welcomeMessage')}
              </p>
            </div>
          </div>

          {/* Comprehensive Import Button */}
          <div className="hidden md:block">
            <ComprehensiveImport />
          </div>
        </div>

        {/* Mobile Comprehensive Import Button */}
        <div className="md:hidden mb-4">
          <ComprehensiveImport />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="group relative bg-white/80 backdrop-blur-sm pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-lg rounded-xl overflow-hidden hover:shadow-jpblue transition-all duration-300 transform hover:scale-105 border border-gray-100"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <dt>
              <div className={`absolute ${stat.color} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate group-hover:text-gray-700 transition-colors">{stat.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-bold text-gray-900 group-hover:text-jpblue-700 transition-colors">{stat.value}</p>
            </dd>
            <div className="absolute inset-0 bg-gradient-to-r from-jpblue-50/0 to-jpblue-100/0 group-hover:from-jpblue-50/20 group-hover:to-jpblue-100/20 transition-all duration-300"></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Matches */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-jpblue-500 to-jpblue-700 rounded-lg flex items-center justify-center">
                  <Swords className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg leading-6 font-semibold bg-gradient-to-r from-gray-900 to-jpblue-700 bg-clip-text text-transparent">{t('recentBouts')}</h3>
              </div>
              <Link
                to="/bouts"
                className="text-sm text-jpblue-600 hover:text-jpblue-500 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-jpblue-50"
              >
                {t('viewAll')}
              </Link>
            </div>
            {recentBouts.length > 0 ? (
              <div className="space-y-3">
                {recentBouts.map((bout) => {
                  const rikishi1 = state.rikishi.find(r => r.id === bout.rikishi1Id);
                  const rikishi2 = state.rikishi.find(r => r.id === bout.rikishi2Id);
                  const winner = state.rikishi.find(r => r.id === bout.winnerId);

                  return (
                    <div key={bout.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-jpblue-50 to-jpblue-100 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-jpblue-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {rikishi1?.name} <span className="text-jpblue-500 font-normal">{t('vs')}</span> {rikishi2?.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {winner ? (
                            <span className="flex items-center space-x-1">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{t('winner')}: <span className="font-medium text-green-700">{winner.name}</span></span>
                              {bout.kimarite && <span className="text-gray-500">({bout.kimarite})</span>}
                            </span>
                          ) : (
                            <span className="text-amber-600">{t('tbd')}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg">
                        {new Date(bout.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Swords className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noBoutsYet')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('getStartedBouts')}</p>
                <div className="mt-6">
                  <Link
                    to="/bouts"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    {t('newBout')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Rikishi */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('topRikishi')}</h3>
              <Link
                to="/rikishi"
                className="text-sm text-jpblue-600 hover:text-jpblue-500 font-medium"
              >
                {t('viewAll')}
              </Link>
            </div>
            {topRikishi.length > 0 ? (
              <div className="space-y-3">
                {topRikishi.map((rikishi, index) => {
                  const winRate = rikishi.wins + rikishi.losses > 0
                    ? ((rikishi.wins / (rikishi.wins + rikishi.losses)) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <div key={rikishi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-jpblue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{rikishi.name}</p>
                          <p className="text-xs text-gray-500">{rikishi.rank} • {rikishi.stable}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{winRate}%</p>
                        <p className="text-xs text-gray-500">{rikishi.wins}-{rikishi.losses}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-jpblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-jpblue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noRikishiYet')}</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{t('getStartedRikishi')}</p>

                {/* Featured Import Option */}
                <div className="bg-gradient-to-br from-jpblue-50 to-jpblue-100 rounded-xl p-6 mb-6 max-w-md mx-auto border border-jpblue-200">
                  <div className="flex items-center justify-center mb-3">
                    <Database className="h-6 w-6 text-jpblue-600 mr-2" />
                    <span className="text-sm font-medium text-jpblue-900">Quick Start</span>
                  </div>
                  <p className="text-xs text-jpblue-700 mb-4 text-center">
                    Import all 9,101 rikishi (active & historical) from the official Sumo API
                  </p>
                  <ComprehensiveImport />
                </div>

                {/* Alternative Options */}
                <div className="text-sm text-gray-500 mb-4">Or manually add rikishi:</div>
                <div className="flex items-center justify-center">
                  <Link
                    to="/rikishi"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-jpblue-600 hover:bg-jpblue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    {t('addRikishi')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}