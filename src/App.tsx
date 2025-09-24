import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SumoProvider } from './context/SumoContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WrestlersPage } from './pages/WrestlersPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { BoutsPage } from './pages/BoutsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { KimaritePage } from './pages/KimaritePage';
import { MeasurementsPage } from './pages/MeasurementsPage';
import { RanksPage } from './pages/RanksPage';
import { ShikonasPage } from './pages/ShikonasPage';
import { BanzukePage } from './pages/BanzukePage';
import { TorikumiPage } from './pages/TorikumiPage';

function App() {
  return (
    <LanguageProvider>
      <SumoProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rikishi" element={<WrestlersPage />} />
              <Route path="/basho" element={<TournamentsPage />} />
              <Route path="/bouts" element={<BoutsPage />} />
              <Route path="/kimarite" element={<KimaritePage />} />
              <Route path="/measurements" element={<MeasurementsPage />} />
              <Route path="/ranks" element={<RanksPage />} />
              <Route path="/shikonas" element={<ShikonasPage />} />
              <Route path="/banzuke" element={<BanzukePage />} />
              <Route path="/torikumi" element={<TorikumiPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Routes>
          </Layout>
        </Router>
      </SumoProvider>
    </LanguageProvider>
  );
}

export default App;
