"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables BEFORE anything else
dotenv_1.default.config({ path: '../.env' }); // Pointing to the root .env file
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const shopRoutes_1 = __importDefault(require("./routes/shopRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
// 1. Initialize App
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 2. Connect to Database
(0, db_1.default)();
// 3. Socket.io Setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    socket.on('join_shop', (shopId) => {
        socket.join(shopId);
        console.log(`Socket ${socket.id} joined shop ${shopId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// Make io accessible to our routes
app.set('io', io);
// 4. Middleware (The "Security Guards")
app.use(express_1.default.json()); // Allow app to parse JSON bodies
app.use((0, cors_1.default)()); // Allow frontend to talk to backend
app.use((0, helmet_1.default)()); // Secure HTTP headers
app.use((0, morgan_1.default)('dev')); // Log requests to console
app.use('/api/auth', authRoutes_1.default);
app.use('/api/shops', shopRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
// 5. Basic Health Check Route
app.get('/', (req, res) => {
    res.send({
        status: 'Active',
        system: 'XeroxSaaS Backend',
        timestamp: new Date()
    });
});
// 6. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
