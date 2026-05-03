import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import prisma from '../utils/prismaClient.js';

export const inviteMemberSchema = z.object({
    email: z.string().email(),
});

export const getMembers = asyncHandler(async (req, res) => {
    const { id: projectId } = req.params;

    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
            user: { select: { id: true, name: true, email: true } }
        }
    });

    return res.status(200).json(new ApiResponse(200, { members }, "Members fetched"));
});

export const inviteMember = asyncHandler(async (req, res) => {
    const { id: projectId } = req.params;
    const { email } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
        throw new ApiError(404, "User with this email not found");
    }

    const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: targetUser.id, projectId } }
    });

    if (existingMember) {
        throw new ApiError(409, "User is already a member of this project");
    }

    const newMember = await prisma.projectMember.create({
        data: {
            userId: targetUser.id,
            projectId,
            role: 'MEMBER'
        },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    return res.status(201).json(new ApiResponse(201, { member: newMember }, "Member added successfully"));
});

export const updateRole = asyncHandler(async (req, res) => {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    if (req.user.id === userId) {
        throw new ApiError(400, "Cannot change your own role");
    }

    const member = await prisma.projectMember.update({
        where: { userId_projectId: { userId, projectId } },
        data: { role },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    return res.status(200).json(new ApiResponse(200, { member }, "Member role updated"));
});

export const removeMember = asyncHandler(async (req, res) => {
    const { id: projectId, userId } = req.params;

    if (req.user.id === userId) {
        throw new ApiError(400, "Cannot remove yourself from the project");
    }

    await prisma.projectMember.delete({
        where: { userId_projectId: { userId, projectId } }
    });

    return res.status(200).json(new ApiResponse(200, {}, "Member removed successfully"));
});
