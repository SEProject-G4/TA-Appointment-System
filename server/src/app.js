const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config');
const { protected, authorize } = require('./middleware/authMiddleware');

const app = express();

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
app.use('/api/user-management', protected, authorize("admin"), require('./routes/userGroupRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
app.use('/api/recruitment-series', require('./routes/recruitmentSeriesRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/cse-office', require('./routes/cseOfficeRoutes'));
app.use('/api/ta', require('./routes/taRoutes'));


app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

module.exports = app;