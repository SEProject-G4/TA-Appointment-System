const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config');
const authMiddleware = require('./middleware/authMiddleware');

// Initialize Redis connection and job processors
const { createRedisConnection } = require('./config/redis');
const { setupJobProcessors } = require('./services/emailJobProcessor');

const app = express();

// Initialize Redis Cloud and job processing on app startup
const initializeServices = async () => {
  try {
    console.log('🔧 Initializing Redis Cloud connection...');
    
    if (!process.env.REDIS_URL) {
      throw new Error(`❌ REDIS_URL environment variable is missing!`);
    }
    
    await createRedisConnection();
    
    console.log('🔧 Setting up job processors for email queue...');
    setupJobProcessors();
    
    console.log('✅ All services initialized successfully. 📧 Email job queue is ready');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error.message);
    
    // Don't exit process in production, but log the error
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n🚫 Exiting due to missing Redis Cloud configuration...');
      process.exit(1);
    }
  }
};

// Request logging middleware (simplified)
app.use((req, res, next) => {
  // Log only important requests in production
  if (process.env.NODE_ENV !== 'production' || req.path.includes('/auth/')) {
    console.log(`📨 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      hasSession: !!req.session?.userId
    });
  }
  next();
});

app.use(express.json());

app.use(session({
  name: 'connect.sid',
  secret: config.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: config.MONGO_URI,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 24 * 60 * 60 // 24 hours
  }),
  cookie: {
    secure: true, 
    httpOnly: true,
    sameSite: 'none', 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/',
    domain: undefined // Don't set domain to allow cross-origin
  },
}));

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    config.FRONTEND_URL,
    'https://ta-appointment-system.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ... mount your other routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user-management', authMiddleware.protected, authMiddleware.authorize("admin"), require('./routes/userGroupRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
app.use('/api/recruitment-series', require('./routes/recruitmentSeriesRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/cse-office', require('./routes/cseOfficeRoutes'));
app.use('/api/ta', require('./routes/taRoutes'));
app.use('/api/documents', require('./routes/driveRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));


app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

initializeServices();

module.exports = app;