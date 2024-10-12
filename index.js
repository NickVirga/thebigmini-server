const express = require("express");
const passport = require('passport');
require('./config/passport');
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(passport.initialize());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.headers.host}${req.url}`);
  } else {
    next();
  }
});

app.use(express.json());

const authRoutes = require("./routes/auth-routes");
// const gamesRoutes = require("./routes/games-routes");

app.use("/api/auth", authRoutes);
// app.use("/api/games", gamesRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });