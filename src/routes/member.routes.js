import { Router } from 'express';
import { getMembers, inviteMember, updateRole, removeMember, inviteMemberSchema } from '../controllers/member.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, loadProjectMember, requireRole } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true }); // Need mergeParams to access projectId from parent route

router.use(authenticate);
router.use(loadProjectMember);

router.get('/', getMembers);
router.post('/', requireRole('ADMIN'), validate(inviteMemberSchema), inviteMember);
router.patch('/:userId', requireRole('ADMIN'), updateRole);
router.delete('/:userId', requireRole('ADMIN'), removeMember);

export default router;
