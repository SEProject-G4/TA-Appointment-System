require('dotenv').config();
const connectDB = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Connect to the database and then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TA Appointment system's backend is listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start the server due to database connection error:', err);
  process.exit(1);
});