"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getFileUrl = exports.uploadFile = void 0;
const s3_1 = __importStar(require("../config/s3"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
// @desc    Upload file to MinIO and get Hash
// @route   POST /api/upload
// @access  Private (Student)
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        // 1. Generate SHA-256 Hash (The "Fingerprint")
        const fileBuffer = req.file.buffer;
        const hashSum = crypto_1.default.createHash('sha256');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');
        // 2. Generate a unique filename for storage (keep original extension)
        const fileExt = req.file.originalname.split('.').pop();
        const storageKey = `${(0, uuid_1.v4)()}.${fileExt}`;
        // 3. Upload to MinIO (S3)
        const params = {
            Bucket: s3_1.BUCKET_NAME,
            Key: storageKey,
            Body: fileBuffer,
            ContentType: req.file.mimetype,
        };
        const uploadResult = yield s3_1.default.upload(params).promise();
        // 4. Return the Keys to Frontend
        // We do NOT save to DB yet. We only return the ID. 
        // The Frontend will send this ID back when the user clicks "Pay".
        res.status(201).json({
            message: 'File uploaded successfully',
            originalName: req.file.originalname,
            storageKey: uploadResult.Key, // The hidden ID
            fileHash: fileHash, // The grouping key
            location: uploadResult.Location
        });
    }
    catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'File upload failed' });
    }
});
exports.uploadFile = uploadFile;
// ... existing imports
// Add this import if missing:
// import s3, { BUCKET_NAME } from '../config/s3';
// @desc    Get Presigned URL for viewing/printing
// @route   POST /api/upload/presigned
// @access  Private (Owner only)
const getFileUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storageKey } = req.body;
        if (!storageKey) {
            res.status(400).json({ message: 'Storage Key is required' });
            return;
        }
        // Generate a link that expires in 5 minutes (300 seconds)
        const url = yield s3_1.default.getSignedUrlPromise('getObject', {
            Bucket: s3_1.BUCKET_NAME,
            Key: storageKey,
            Expires: 300,
        });
        res.json({ url });
    }
    catch (error) {
        console.error('Presign Error:', error);
        res.status(500).json({ message: 'Could not generate link' });
    }
});
exports.getFileUrl = getFileUrl;
