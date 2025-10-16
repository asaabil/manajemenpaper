
import { Router } from 'express';
import * as artifactsController from '../controllers/artifacts.controller.js';
import { authRequired } from '../middlewares/auth.js';
import { uploadArtifact } from '../middlewares/upload.js';

const router = Router({ mergeParams: true });

router.post('/', authRequired, uploadArtifact.single('file'), artifactsController.createArtifact);
router.get('/', artifactsController.getArtifactsForPaper);
router.get('/:id', artifactsController.getArtifactById);
router.get('/:id/download', artifactsController.downloadArtifact);
router.patch('/:id', authRequired, artifactsController.updateArtifact);
router.delete('/:id', authRequired, artifactsController.deleteArtifact);

export default router;
