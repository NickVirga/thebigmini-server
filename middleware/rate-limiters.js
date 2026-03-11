const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later." }
});

const gamesLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Daily game submission & statistic retrieval limit reached." }
});

module.exports = { globalLimiter, authLimiter, gamesLimiter };