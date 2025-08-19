const express = require('express');
const cors = require('cors');
const session = require('express-session');
const config = require('./config');
const { protected, authorize } = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  },
}));

// ... mount your other routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user-management', protected, authorize("admin"), require('./routes/userGroupRoutes'));

app.get('/', (req, res) => {
  res.send('TA Appointment System Backend is running!');
});

module.exports = app;