import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import papersRoutes from './papers.routes.js';
import readingListsRoutes from './readingLists.routes.js';
import searchRoutes from './search.routes.js';
import statsRoutes from './stats.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/papers', papersRoutes);
router.use('/reading-lists', readingListsRoutes);
router.use('/search', searchRoutes);
router.use('/stats', statsRoutes);

export default router;