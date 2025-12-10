import * as dotenv from 'dotenv';
import type { Application } from 'express';
const app = require('./src/app');
const connectDB = require('./src/config/database');

dotenv.config();

const userGroupController = require('./src/controllers/userGroupController');

const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Connect to the database and then start the server
connectDB()
  .then(() => {
    userGroupController.initializeUserGroups();
    app.listen(PORT, () => {
      console.log(`TA Appointment system's backend is listening on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Failed to start the server due to database connection error:', err);
    process.exit(1);
  });