const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15mins
  max: 100, //100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15mins
  max: 20, //20 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later." }
});

const gamesLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, //24hrs
  max: 10, //10 requests
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Daily game submission & statistic retrieval limit reached." }
});

module.exports = { globalLimiter, authLimiter, gamesLimiter };