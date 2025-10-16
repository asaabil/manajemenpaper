
import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authRequired } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';

const router = Router();

router.use(authRequired, requireRoles('admin'));

router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.patch('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;
