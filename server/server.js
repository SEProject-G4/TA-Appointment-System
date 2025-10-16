require('dotenv').config();
const connectDB = require('./src/config/database');
const cors = require('cors');
const app = require('./src/app');
const userGroupController = require('./src/controllers/userGroupController');

const PORT = process.env.PORT || 5000;

// Connect to the database and then start the server
connectDB().then(() => {
  userGroupController.initializeUserGroups();
  app.listen(PORT, () => {
    console.log(`TA Appointment system's backend is listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start the server due to database connection error:', err);
  process.exit(1);
});