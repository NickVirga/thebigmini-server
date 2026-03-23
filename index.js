const express = require("express");
const passport = require('passport');
require('./config/passport');
const cors = require("cors");
require("dotenv").config();
const { globalLimiter, authLimiter, gamesLimiter } = require("./middleware/rate-limiters");

const app = express();

app.use(passport.initialize());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json());
app.use(globalLimiter);

const authRoutes = require("./routes/auth-routes");
const gamesRoutes = require("./routes/games-routes");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/games", gamesRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });