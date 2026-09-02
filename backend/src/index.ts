import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import applicationRoutes from './routes/applicationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import cvRoutes from './routes/cvRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());


// Routes
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Maga Backend' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/cv', cvRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Maga server active on http://localhost:${PORT}`);
});