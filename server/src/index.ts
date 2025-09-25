import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rikishiRoutes from './routes/rikishi.js';
import bashoRoutes from './routes/basho.js';
import measurementsRoutes from './routes/measurements.js';
import ranksRoutes from './routes/ranks.js';
import shikonasRoutes from './routes/shikonas.js';
import banzukeRoutes from './routes/banzuke.js';
import torikumiRoutes from './routes/torikumi.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/rikishi', rikishiRoutes);
app.use('/api/basho', bashoRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/ranks', ranksRoutes);
app.use('/api/shikonas', shikonasRoutes);
app.use('/api/banzuke', banzukeRoutes);
app.use('/api/torikumi', torikumiRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 API available at http://localhost:${port}/api`);
  console.log(`🏥 Health check at http://localhost:${port}/health`);
});