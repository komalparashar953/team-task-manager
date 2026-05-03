import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../utils/prismaClient.js';

export const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            throw new ApiError(401, 'Invalid Access Token');
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid Access Token');
    }
});

export const loadProjectMember = asyncHandler(async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id; // params.id in project routes, params.projectId in sub-routes
    if (!projectId) {
        throw new ApiError(400, 'Project ID is required');
    }

    const projectMember = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId: req.user.id,
                projectId,
            },
        },
    });

    if (!projectMember) {
        throw new ApiError(403, 'You are not a member of this project');
    }

    req.projectMember = projectMember;
    next();
});

export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.projectMember) {
            return next(new ApiError(403, 'Project membership not loaded'));
        }
        if (req.projectMember.role !== role) {
            return next(new ApiError(403, `Requires ${role} role`));
        }
        next();
    };
};
