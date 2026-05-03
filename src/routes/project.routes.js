import { Router } from 'express';
import { createProject, getProjects, getProjectDetails, updateProject, deleteProject, projectSchema } from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, loadProjectMember, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(projectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', loadProjectMember, getProjectDetails);
router.patch('/:id', validate(projectSchema.partial()), loadProjectMember, requireRole('ADMIN'), updateProject);
router.delete('/:id', loadProjectMember, requireRole('ADMIN'), deleteProject);

export default router;
