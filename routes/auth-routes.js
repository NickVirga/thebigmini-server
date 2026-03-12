const router = require("express").Router();
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile"));
const dotenv = require("dotenv");
const passport = require('passport');

dotenv.config();

const {
  JWT_ACCESS_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  ACCESS_TOKEN_DURATION,
  REFRESH_TOKEN_DURATION,
} = process.env;

// Google Auth Route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {

  const { accessToken, refreshToken } = req.user;

  res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

// Facebook Auth Route
router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/' }), (req, res) => {

  const { accessToken, refreshToken } = req.user;

  res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

// // Discord Auth Route
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', { session: false, failureRedirect: '/' }), (req, res) => {

  const { accessToken, refreshToken } = req.user;

  res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

// Twitter Auth Route
// router.get('/twitter', passport.authenticate('twitter'));

// router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {

//   const { accessToken, refreshToken } = req.user;

//   res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
// });


router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET_KEY);
    const user = await knex("users").where({ id: decoded.userId }).first();

    if (
      !user ||
      user.refresh_token_version !== decoded.refreshTokenVersion
    ) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_ACCESS_SECRET_KEY,
      { expiresIn: ACCESS_TOKEN_DURATION }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        refreshTokenVersion: decoded.refreshTokenVersion,
      },
      JWT_REFRESH_SECRET_KEY,
      { expiresIn: REFRESH_TOKEN_DURATION }
    );
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET_KEY);
    const { userId } = decoded;

    await knex("users")
      .where({ id: userId })
      .increment('refresh_token_version', 1);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
