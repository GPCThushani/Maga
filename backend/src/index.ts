import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

// 1. Initialize app FIRST
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect Database
connectDB();

// 3. Global Middleware
app.use(cors());
app.use(express.json());

// 4. Routes
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Maga Backend' });
});

app.use('/api/v1/auth', authRoutes);

// 5. Start Server
app.listen(PORT, () => {
  console.log(`Maga server active on http://localhost:${PORT}`);
});