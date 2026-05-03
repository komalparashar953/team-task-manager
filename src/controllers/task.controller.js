import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import prisma from '../utils/prismaClient.js';

const TStatus = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const TPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    status: TStatus.default("TODO"),
    priority: TPriority.default("MEDIUM"),
    dueDate: z.string().datetime().optional().refine((date) => !date || new Date(date) > new Date(), {
        message: "Due date must be in the future",
    }),
    assigneeId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const getTasks = asyncHandler(async (req, res) => {
    const { id: projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
        where,
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(new ApiResponse(200, { tasks }, "Tasks fetched"));
});

export const createTask = asyncHandler(async (req, res) => {
    const { id: projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (assigneeId) {
        const isMember = await prisma.projectMember.findFirst({
            where: { projectId, userId: assigneeId }
        });
        if (!isMember) {
            throw new ApiError(400, "Assignee must be a project member");
        }
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            projectId,
            creatorId: req.user.id,
            assigneeId
        },
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } }
        }
    });

    return res.status(201).json(new ApiResponse(201, { task }, "Task created"));
});

export const getTaskDetails = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } }
        }
    });

    if (!task) throw new ApiError(404, "Task not found");

    return res.status(200).json(new ApiResponse(200, { task }, "Task fetched"));
});

export const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, "Task not found");

    // Auth check for MEMBER
    if (req.projectMember.role === 'MEMBER') {
        // Member can only update task if they are creator or assignee, or if they are updating status of assigned task
        const isAssignee = task.assigneeId === req.user.id;
        const isCreator = task.creatorId === req.user.id;

        if (!isAssignee && !isCreator) {
            throw new ApiError(403, "You can only update your own or assigned tasks");
        }
    }

    if (assigneeId && assigneeId !== task.assigneeId) {
        const isMember = await prisma.projectMember.findFirst({
            where: { projectId: task.projectId, userId: assigneeId }
        });
        if (!isMember) {
            throw new ApiError(400, "Assignee must be a project member");
        }
    }

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assigneeId
        },
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } }
        }
    });

    return res.status(200).json(new ApiResponse(200, { task: updatedTask }, "Task updated"));
});

export const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, "Task not found");

    if (req.projectMember.role === 'MEMBER' && task.creatorId !== req.user.id) {
        throw new ApiError(403, "Only the creator can delete this task");
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.status(200).json(new ApiResponse(200, {}, "Task deleted"));
});
