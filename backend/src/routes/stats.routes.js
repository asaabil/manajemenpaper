
import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.get('/papers/top-downloads', statsController.getTopDownloadedPapers);
router.get('/papers/top-views', statsController.getTopViewedPapers);

export default router;
