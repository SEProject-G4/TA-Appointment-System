const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config');
const { protected, authorize } = require('./middleware/authMiddleware');

const app = express();

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.slice(0, 50),
    hasCookies: !!req.headers.cookie,
    sessionId: req.session?.id
  });
  next();
});

app.use(express.json());

app.use(session({
  name: 'connect.sid',
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // Temporarily disable MongoDB store for testing
  // store: MongoStore.create({
  //   mongoUrl: config.MONGO_URI,
  //   touchAfter: 24 * 3600, // lazy session update
  //   ttl: 24 * 60 * 60 // 24 hours
  // }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/'
  },
}));

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    config.FRONTEND_URL,
    'https://ta-appointment-system.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ... mount your other routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user-management', protected, authorize("admin"), require('./routes/userGroupRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
app.use('/api/recruitment-series', require('./routes/recruitmentSeriesRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/cse-office', require('./routes/cseOfficeRoutes'));
app.use('/api/ta', require('./routes/taRoutes'));


app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

// Test endpoint without authentication
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Test cookie setting
app.get('/api/test-cookie', (req, res) => {
  res.cookie('test-cookie', 'test-value', {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24
  });
  
  res.json({ 
    message: 'Test cookie set',
    environment: process.env.NODE_ENV,
    secure: process.env.NODE_ENV === 'production'
  });
});

// Debug endpoint to check session status
app.get('/api/debug/session', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    hasSession: !!req.session,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    cookies: req.headers.cookie || 'none',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.slice(0, 100),
    frontendUrl: config.FRONTEND_URL,
    corsOrigins: [
      'http://localhost:5173', 
      'http://localhost:3000',
      config.FRONTEND_URL,
      'https://ta-appointment-system.vercel.app'
    ]
  });
});

module.exports = app;