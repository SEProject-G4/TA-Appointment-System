require('dotenv').config();

module.exports = {
  PORT: process.env.PORT,
  SESSION_SECRET: process.env.SESSION_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL,

  //Google OAuth configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
};
