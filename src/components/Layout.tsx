import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  Trophy,
  Swords,
  BarChart3,
  Home,
  Menu,
  X,
  Target,
  Ruler,
  Award,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  const navigation = [
    { name: t('dashboard'), href: '/', icon: Home },
    { name: t('wrestlers'), href: '/rikishi', icon: Users },
    { name: t('tournaments'), href: '/basho', icon: Trophy },
    { name: t('matches'), href: '/bouts', icon: Swords },
    { name: 'Kimarite', href: '/kimarite', icon: Target },
    { name: 'Measurements', href: '/measurements', icon: Ruler },
    { name: 'Ranks', href: '/ranks', icon: Award },
    { name: 'Shikonas', href: '/shikonas', icon: Users },
    { name: 'Banzuke', href: '/banzuke', icon: Trophy },
    { name: 'Torikumi', href: '/torikumi', icon: Calendar },
    { name: t('statistics'), href: '/statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-jpblue-50 via-gray-50 to-jpblue-100 bg-japanese-pattern">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-jpblue-600 to-jpblue-800 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">相</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-jpblue-600 to-jpblue-800 bg-clip-text text-transparent">SumoMine</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gradient-to-r from-jpblue-100 to-jpblue-200 text-jpblue-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-jpblue-50 hover:to-jpblue-100 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-all duration-200 animate-fade-in`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-jpblue-500' : 'text-gray-400 group-hover:text-jpblue-500'
                      } mr-4 flex-shrink-0 h-6 w-6 transition-colors duration-200`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white/95 backdrop-blur-sm shadow-jpblue">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-jpblue-600 to-jpblue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white font-bold text-lg">相</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-jpblue-600 to-jpblue-800 bg-clip-text text-transparent">SumoMine</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-transparent space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gradient-to-r from-jpblue-100 to-jpblue-200 text-jpblue-900 shadow-sm border-r-2 border-jpblue-500'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-jpblue-50 hover:to-jpblue-100 hover:text-gray-900 hover:shadow-sm'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-jpblue-500' : 'text-gray-400 group-hover:text-jpblue-500'
                      } mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-jpblue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 md:flex-none"></div>
            <LanguageSwitcher />
          </div>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}