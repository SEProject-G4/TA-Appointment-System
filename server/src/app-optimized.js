const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('./config');
const { protected, authorize } = require('./middleware/authMiddleware-optimized');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Configure based on your needs
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authRateLimit);
app.use(generalRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      config.FRONTEND_URL,
      // Add production URLs
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Optimized session configuration
app.use(session({
  name: 'ta.session.id', // Custom session name (security through obscurity)
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't save empty sessions
  rolling: true, // Reset expiry on activity
  
  // Use MongoDB for session storage (persistent across restarts)
  store: MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 day (in seconds)
    autoRemove: 'native', // Use MongoDB's TTL
    touchAfter: 24 * 3600, // Only update session once per 24 hours unless data changes
    stringify: false, // Don't stringify session data
    crypto: {
      secret: config.SESSION_CRYPTO_SECRET || config.SESSION_SECRET
    }
  }),
  
  cookie: {
    name: 'ta.session.id',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    // Add domain for production
    ...(process.env.NODE_ENV === 'production' && { 
      domain: config.COOKIE_DOMAIN 
    })
  },
}));

// Session debugging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
  });
}

// Health check endpoint (doesn't require session)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user-management', protected, authorize("admin"), require('./routes/userGroupRoutes'));
app.use('/api/lecturer', protected, require('./routes/lecturerRoutes'));
app.use('/api/recruitment-series', protected, require('./routes/recruitmentSeriesRoutes'));
app.use('/api/modules', protected, require('./routes/moduleRoutes'));
app.use('/api/cse-office', protected, require('./routes/cseOfficeRoutes'));
app.use('/api/ta', protected, require('./routes/taRoutes'));

app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

module.exports = app;