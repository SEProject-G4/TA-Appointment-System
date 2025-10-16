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
app.use(cors({
  origin: ['http://localhost:5173', config.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// app.use(cors());

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.MONGO_URI,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 24 * 60 * 60 // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  },
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

// Debug endpoint to check session status
app.get('/api/debug/session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: req.session?.userId,
    cookies: req.headers.cookie ? 'present' : 'missing',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.slice(0, 100)
  });
});

module.exports = app;