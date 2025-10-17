const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    config.FRONTEND_URL // Production frontend URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 1 day
    stringify: false,
    autoRemove: 'interval',
    autoRemoveInterval: 10 // minutes
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24
  },
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


app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

module.exports = app;