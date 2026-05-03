import { Router } from 'express';
import { getTasks, createTask, getTaskDetails, updateTask, deleteTask, createTaskSchema, updateTaskSchema } from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, loadProjectMember } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(loadProjectMember);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:taskId', getTaskDetails);
router.patch('/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/:taskId', deleteTask);

export default router;
