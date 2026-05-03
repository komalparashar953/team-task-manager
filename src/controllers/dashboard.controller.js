import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import prisma from '../utils/prismaClient.js';

export const getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const projectMemberships = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true }
    });

    const projectIds = projectMemberships.map(pm => pm.projectId);

    const myTasks = await prisma.task.findMany({
        where: { assigneeId: userId, status: { not: 'DONE' } },
        include: { project: { select: { name: true } } },
        orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const overdueTasks = await prisma.task.findMany({
        where: {
            projectId: { in: projectIds },
            dueDate: { lt: now },
            status: { not: 'DONE' }
        },
        include: { project: { select: { name: true } } },
        orderBy: { dueDate: 'asc' }
    });

    const tasksByStatus = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId: { in: projectIds } },
        _count: { id: true }
    });

    const formattedTasksByStatus = {
        TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0
    };
    tasksByStatus.forEach(t => {
        formattedTasksByStatus[t.status] = t._count.id;
    });

    const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: {
            _count: { select: { tasks: true, members: true } }
        }
    });

    return res.status(200).json(new ApiResponse(200, {
        myTasks,
        overdueTasks,
        tasksByStatus: formattedTasksByStatus,
        projectSummaries: projects
    }, "Dashboard data fetched"));
});
