const express = require('express');
import type { Application, Request, Response, NextFunction } from 'express';
const cors = require('cors');
import session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./config/index');

// should be updated
const authMiddleware = require('./middleware/authMiddleware');

const app: Application = express();

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Request logging middleware (simplified)
app.use((req: Request, res: Response, next: NextFunction) => {
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
  secret: config.SESSION_SECRET as string,
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: config.MONGO_URI as string,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 24 * 60 * 60 // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // lax for development
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/',
    domain: undefined // Don't set domain to allow cross-origin
  },
}));

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    config.FRONTEND_URL as string,
    'https://ta-appointment-system.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
app.use('/api/applications', require('./routes/applicationRoutes'));


app.get('/', (req: Request, res: Response) => {
  res.send('TA Appointment System Backend is running!');
});

module.exports = app;