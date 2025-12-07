const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const petRoutes = require('./routes/pets');
const activityRoutes = require('./routes/activities');
const adoptionRoutes = require('./routes/adoptions');
const shelterRoutes = require('./routes/shelters');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/shelters', shelterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Pet Adoption API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve frontend files for production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 API URL: http://localhost:${PORT}/api`);
        console.log(`🏠 Frontend URL: http://localhost:${PORT}`);
    });
};

startServer().catch(console.error);

module.exports = app;