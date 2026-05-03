import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import prisma from '../utils/prismaClient.js';

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt }
    });

    return { accessToken, refreshToken };
};

export const signupSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, "Password must contain at least one uppercase letter and one number"),
});

export const signup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError(409, "User with email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    return res.status(201).json(new ApiResponse(201, { user }, "User registered successfully"));
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    const loggedInUser = { id: user.id, name: user.name, email: user.email };

    return res.status(200)
        .cookie("accessToken", accessToken, { ...options, maxAge: 15 * 60 * 1000 })
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "User logged in successfully"));
});

export const refresh = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
        const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: incomingRefreshToken } });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } }); // Rotate token

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(decodedToken.userId);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        };

        return res.status(200)
            .cookie("accessToken", accessToken, { ...options, maxAge: 15 * 60 * 1000 })
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

export const logout = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
        await prisma.refreshToken.deleteMany({ where: { token } });
    }

    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export const me = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
});
