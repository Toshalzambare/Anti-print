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
exports.BUCKET_NAME = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    endpoint: `http://localhost:${process.env.MINIO_PORT || 9000}`,
    s3ForcePathStyle: true, // Needed for MinIO
    signatureVersion: 'v4',
});
exports.BUCKET_NAME = process.env.MINIO_DEFAULT_BUCKET || 'print-documents';
// Check if bucket exists, if not, create it (Safety check)
const initBucket = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield s3.headBucket({ Bucket: exports.BUCKET_NAME }).promise();
        console.log(`✅ Storage Bucket '${exports.BUCKET_NAME}' is ready.`);
    }
    catch (err) {
        console.log(`⚠️ Bucket '${exports.BUCKET_NAME}' not found. Creating...`);
        try {
            yield s3.createBucket({ Bucket: exports.BUCKET_NAME }).promise();
            console.log(`✅ Bucket '${exports.BUCKET_NAME}' created.`);
        }
        catch (createErr) {
            console.error('❌ Failed to create bucket:', createErr);
        }
    }
});
initBucket();
exports.default = s3;
