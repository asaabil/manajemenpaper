
import { Router } from 'express';
import * as readingListsController from '../controllers/readingLists.controller.js';
import { authRequired } from '../middlewares/auth.js';

const router = Router();

router.use(authRequired);

router.post('/', readingListsController.createReadingList);
router.get('/me', readingListsController.getMyReadingLists);
router.get('/:id', readingListsController.getReadingListById);
router.patch('/:id', readingListsController.updateReadingList);
router.delete('/:id', readingListsController.deleteReadingList);
router.post('/:id/items', readingListsController.addPaperToReadingList);
router.delete('/:id/items/:paperId', readingListsController.removePaperFromReadingList);

export default router;
