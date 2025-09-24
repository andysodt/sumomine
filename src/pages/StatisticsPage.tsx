import React from 'react';
import { BarChart3, TrendingUp, Users, Trophy } from 'lucide-react';
import { useSumo } from '../context/SumoContext';
import { useLanguage } from '../context/LanguageContext';

export function StatisticsPage() {
  const { state } = useSumo();
  const { t } = useLanguage();

  const calculateStats = () => {
    const totalBouts = state.bouts.length;
    const totalRikishi = state.rikishi.length;
    const activeBasho = state.basho.length;

    // Calculate kimarite distribution
    const kimariiteCount: Record<string, number> = {};
    state.bouts.forEach(bout => {
      if (bout.kimarite) {
        kimariiteCount[bout.kimarite] = (kimariiteCount[bout.kimarite] || 0) + 1;
      }
    });

    const topKimarite = Object.entries(kimariiteCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Calculate rikishi performance
    const rikishiStats = state.rikishi.map(rikishi => {
      const rikishiBouts = state.bouts.filter(
        bout => bout.rikishi1Id === rikishi.id || bout.rikishi2Id === rikishi.id
      );
      const wins = rikishiBouts.filter(bout => bout.winnerId === rikishi.id).length;
      const losses = rikishiBouts.length - wins;
      const winRate = rikishiBouts.length > 0 ? (wins / rikishiBouts.length) * 100 : 0;

      return {
        ...rikishi,
        boutCount: rikishiBouts.length,
        winRate: winRate.toFixed(1),
      };
    }).sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    return {
      totalBouts,
      totalRikishi,
      activeBasho,
      topKimarite,
      topRikishi: rikishiStats.slice(0, 5),
    };
  };

  const stats = calculateStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('statisticsPageTitle')}</h1>
        <p className="mt-2 text-gray-600">
          {t('statisticsPageDescription')}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('totalRikishi')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalRikishi}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('tournaments')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeBasho}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('totalBouts')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalBouts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('avgWinRate')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.topRikishi.length > 0
                      ? (stats.topRikishi.reduce((sum, r) => sum + parseFloat(r.winRate), 0) / stats.topRikishi.length).toFixed(1)
                      : '0.0'}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Rikishi */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('topPerformingRikishi')}
            </h3>
            {stats.topRikishi.length > 0 ? (
              <div className="space-y-3">
                {stats.topRikishi.map((rikishi, index) => (
                  <div key={rikishi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{rikishi.name}</p>
                        <p className="text-xs text-gray-500">{rikishi.rank} • {rikishi.stable}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{rikishi.winRate}%</p>
                      <p className="text-xs text-gray-500">{rikishi.boutCount} {t('matches')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noRikishiData')}</p>
            )}
          </div>
        </div>

        {/* Top Kimarite */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('mostCommonWinningTechniques')}
            </h3>
            {stats.topKimarite.length > 0 ? (
              <div className="space-y-3">
                {stats.topKimarite.map(([kimarite, count], index) => (
                  <div key={kimarite} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{kimarite}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">
                        {stats.totalBouts > 0 ? ((count / stats.totalBouts) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noMatchData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}