"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.loginUser = exports.registerShopOwner = exports.registerStudent = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const google_auth_library_1 = require("google-auth-library");
// Allow using the same VITE_ variable for backend convenience, or standard GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
// @desc    Register a new Student
// @route   POST /api/auth/register-student
// @access  Public
const registerStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // 1. Validation
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Please fill all fields' });
            return;
        }
        // 2. Check if user exists
        const userExists = yield User_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // 3. Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // 4. Create User (Role: STUDENT)
        const user = yield User_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: 'STUDENT'
        });
        if (user) {
            const token = (0, generateToken_1.default)(res, user._id.toString());
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token,
                message: 'Student registered successfully'
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.registerStudent = registerStudent;
// @desc    Register a new Shop Owner
// @route   POST /api/auth/register-shop
// @access  Public
const registerShopOwner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // 1. Validation
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Please fill all fields' });
            return;
        }
        // 2. Check if user exists
        const userExists = yield User_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // 3. Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // 4. Create User (Role: OWNER)
        const user = yield User_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: 'OWNER'
        });
        if (user) {
            (0, generateToken_1.default)(res, user._id.toString());
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                message: 'Shop Owner registered successfully'
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.registerShopOwner = registerShopOwner;
// @desc    Login User (Shop Owner or Employee)
// @route   POST /api/auth/login
// @access  Public
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // 1. Find user by email (Explicitly select password because we hid it in Model)
        const user = yield User_1.default.findOne({ email }).select('+password');
        // 2. Check password
        if (user && user.password && (yield bcryptjs_1.default.compare(password, user.password))) {
            const token = (0, generateToken_1.default)(res, user._id.toString());
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.loginUser = loginUser;
// @desc    Google Login (Real Verification)
// @route   POST /api/auth/google
// @access  Public
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credential } = req.body; // The JWT token from Google
        if (!credential) {
            res.status(400).json({ message: 'No credential provided' });
            return;
        }
        // 1. Verify Token with Google
        const ticket = yield client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload) {
            res.status(400).json({ message: 'Invalid Google Token' });
            return;
        }
        const { email, name, sub: googleId } = payload;
        if (!email) {
            res.status(400).json({ message: 'Email access required' });
            return;
        }
        // 2. Check if user exists
        let user = yield User_1.default.findOne({ email });
        if (!user) {
            // 3. Register new student automatically
            user = yield User_1.default.create({
                name: name || 'Student',
                email,
                googleId,
                role: 'STUDENT'
            });
        }
        // 4. Generate Token
        const token = (0, generateToken_1.default)(res, user._id.toString());
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token
        });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        res.status(400).json({ message: 'Google Authentication Failed' });
    }
});
exports.googleLogin = googleLogin;
