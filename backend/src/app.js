
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1', apiRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../', env.uploadDir)));

// Error handler
app.use(errorHandler);

export default app;
