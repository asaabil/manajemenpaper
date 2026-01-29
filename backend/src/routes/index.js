import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import papersRoutes from './papers.routes.js';
import readingListsRoutes from './readingLists.routes.js';
import searchRoutes from './search.routes.js';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/papers', papersRoutes);
router.use('/reading-lists', readingListsRoutes);
router.use('/search', searchRoutes);

// Directly defined stats routes
router.get('/stats/top-d', statsController.getTopDownloadedPapers);
router.get('/stats/papers/top-viewed', statsController.getTopViewedPapers);

export default router;
