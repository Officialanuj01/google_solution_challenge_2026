require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/error.middleware');

// ── Initialize Express ──────────
const app = express();

// ── Middleware ───────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Authorization'],
    maxAge: 86400
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request Logging ─────────────────────────
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// ── Routes ──────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const predictRoutes = require('./routes/predict.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const insightsRoutes = require('./routes/insights.routes');
const dataRoutes = require('./routes/data.routes');

app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/data', dataRoutes);


// ── Health Check ────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Pulse API',
        version: '2.0.0',
        architecture: {
            compute: 'Render',
            ml: 'Vertex AI',
            calling: 'Twilio',
            insights: 'Gemini API'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Error Handling ──────────────────────────
app.use(errorHandler);

// ── Database Connection ─────────────────────
const MONGODB_URI = process.env.MONGODB_URI || '';

mongoose.connect(MONGODB_URI)
    .then(() => logger.info('✅ Connected to MongoDB' + MONGODB_URI))
    .catch(err => logger.warn('⚠️ MongoDB connection error (server will continue):', err.message, `this is what${MONGODB_URI}`));

// ── Start Server ────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`🚀 Pulse API running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

});

module.exports = app;

