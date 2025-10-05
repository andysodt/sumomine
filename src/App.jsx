import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RikishiList from './pages/RikishiList';
import RikishiDetails from './pages/RikishiDetails';
import BashoDetails from './pages/BashoDetails';
import BanzukeList from './pages/BanzukeList';
import BanzukeDetails from './pages/BanzukeDetails';
import RankProgression from './pages/RankProgression';
import MeasurementProgression from './pages/MeasurementProgression';
import KimariteProgression from './pages/KimariteProgression';
import ImageUpload from './pages/ImageUpload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rikishi" element={<RikishiList />} />
        <Route path="rikishi/:id" element={<RikishiDetails />} />
        <Route path="basho" element={<BashoDetails />} />
        <Route path="basho/:id" element={<BashoDetails />} />
        <Route path="banzuke" element={<BanzukeList />} />
        <Route path="banzuke/:id" element={<BanzukeDetails />} />
        <Route path="rank-progression" element={<RankProgression />} />
        <Route path="measurement-progression" element={<MeasurementProgression />} />
        <Route path="kimarite-progression" element={<KimariteProgression />} />
        <Route path="image-upload" element={<ImageUpload />} />
      </Route>
    </Routes>
  );
}

export default App;
