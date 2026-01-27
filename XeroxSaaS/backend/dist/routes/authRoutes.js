"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post('/register-shop', authController_1.registerShopOwner);
router.post('/register-student', authController_1.registerStudent);
router.post('/login', authController_1.loginUser);
router.post('/google', authController_1.googleLogin);
exports.default = router;
