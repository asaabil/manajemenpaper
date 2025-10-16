import { Router } from 'express';
import * as papersController from '../controllers/papers.controller.js';
import { authRequired } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';
import { uploadPaper, uploadPaperWithArtifacts } from '../middlewares/upload.js';
import artifactsRoutes from './artifacts.routes.js';

const router = Router();

router.post('/', authRequired, requireRoles('dosen', 'admin'), uploadPaperWithArtifacts.any(), papersController.createPaper);
router.post('/upload-bib', authRequired, requireRoles('dosen', 'admin'), papersController.createPapersFromBib);
router.get('/', papersController.getPapers);
router.get('/:id', papersController.getPaperById);
router.get('/:id/download', papersController.downloadPaper);
router.patch('/:id', authRequired, uploadPaperWithArtifacts.any(), papersController.updatePaper);
router.post('/:id/version', authRequired, uploadPaper.single('file'), papersController.addVersion);
router.delete('/:id', authRequired, requireRoles('dosen', 'admin'), papersController.deletePaper);

router.use('/:paperId/artifacts', artifactsRoutes);

export default router;