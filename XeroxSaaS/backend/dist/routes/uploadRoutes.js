"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("../controllers/uploadController"); // <--- Import getFileUrl
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});
router.post('/', authMiddleware_1.protect, upload.single('file'), uploadController_1.uploadFile);
// NEW ROUTE: Only Shop Owners can get download links
router.post('/presigned', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('OWNER', 'EMPLOYEE'), uploadController_1.getFileUrl);
exports.default = router;
