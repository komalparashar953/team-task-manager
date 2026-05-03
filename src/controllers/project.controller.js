import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import prisma from '../utils/prismaClient.js';

export const projectSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
});

export const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await prisma.project.create({
        data: {
            name,
            description,
            members: {
                create: {
                    userId: req.user.id,
                    role: 'ADMIN'
                }
            }
        }
    });

    return res.status(201).json(new ApiResponse(201, { project }, "Project created successfully"));
});

export const getProjects = asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
        where: {
            members: {
                some: { userId: req.user.id }
            }
        },
        include: {
            _count: { select: { members: true, tasks: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json(new ApiResponse(200, { projects }, "Projects fetched"));
});

export const getProjectDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } }
            }
        }
    });

    if (!project) throw new ApiError(404, "Project not found");

    return res.status(200).json(new ApiResponse(200, { project }, "Project details fetched"));
});

export const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.update({
        where: { id },
        data: { name, description }
    });

    return res.status(200).json(new ApiResponse(200, { project }, "Project updated successfully"));
});

export const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.project.delete({ where: { id } });

    return res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully"));
});
