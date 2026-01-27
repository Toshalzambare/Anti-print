"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (res, userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET is not defined in .env');
    }
    // Create the token
    const token = jsonwebtoken_1.default.sign({ userId }, secret, {
        expiresIn: '30d', // Session lasts 30 days
    });
    // Option 1: Send as HTTP-Only Cookie (More Secure for Web)
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use HTTPS in prod
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    // Option 2: Also return it in JSON (for Mobile/Postman testing)
    return token;
};
exports.default = generateToken;
