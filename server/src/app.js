const express = require("express");
const session = require("express-session");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const config = require("./config");
const connectDB = require("./config/database");

const app = express();

app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: false,
    },
  })
);

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

app.use("api/auth", authRoutes);

const port = config.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(
        `TA Appointment system's backend is listening on port ${port}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "Failed to start the server due to database connection error:",
      err
    );
    process.exit(1);
  });
