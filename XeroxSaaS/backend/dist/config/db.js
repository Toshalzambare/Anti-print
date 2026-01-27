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
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Get the connection string from our Environment Variables (No Hardcoding!)
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('❌ FATAL ERROR: MONGO_URI is not defined in .env');
        process.exit(1); // Stop the app if config is missing
    }
    // 2. The Retry Logic
    const MAX_RETRIES = 5;
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            // Attempt connection
            const conn = yield mongoose_1.default.connect(MONGO_URI);
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            return; // Success! Exit the loop.
        }
        catch (error) {
            retries++;
            console.error(`⚠️ MongoDB Connection Failed (Attempt ${retries}/${MAX_RETRIES})... Retrying in 5s.`);
            // Wait for 5 seconds before trying again
            yield new Promise(res => setTimeout(res, 5000));
        }
    }
    // 3. If we fail 5 times, we crash intentionally so Docker can restart the container
    console.error('❌ Could not connect to MongoDB after multiple attempts. Exiting.');
    process.exit(1);
});
exports.default = connectDB;
