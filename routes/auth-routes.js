const router = require("express").Router();
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const passport = require('passport');

dotenv.config();

const {
  GOOGLE_OAUTH_CLIENT_ID,
  JWT_ACCESS_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
} = process.env;

const authClient = new OAuth2Client(GOOGLE_OAUTH_CLIENT_ID);

const accessTokenDuration = "15m";
const refreshTokenDuration = "30d";

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
// router.get('/discord', passport.authenticate('discord'));

// router.get('/discord/callback', passport.authenticate('discord', { session: false, failureRedirect: '/' }), (req, res) => {

//   const { accessToken, refreshToken } = req.user;

//   res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
// });

// Twitter Auth Route
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {

  const { accessToken, refreshToken } = req.user;

  res.redirect(`${process.env.CORS_ORIGIN}/auth/login-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});



const getProviderId = async (providerName) => {
  const provider = await knex("authentication_providers")
    .select("id")
    .where({ provider_name: providerName })
    .first();
  if (!provider) {
    throw new Error("Authentication provider not found");
  }
  return provider.id;
};

const findOrCreateUser = async (providerId, providerUserId, userEmail) => {
  const user = await knex("users")
    .where({ provider_user_id: providerUserId, provider_id: providerId })
    .first();

  if (!user) {
    const userId = uuidv4();
    await knex("users").insert({
      id: userId,
      provider_id: providerId,
      provider_user_id: providerUserId,
      email: userEmail,
      refresh_token_version: 1,
    });
    return { userId, refreshTokenVersion: 1 };
  } else {
    return { userId: user.id, refreshTokenVersion: user.refresh_token_version };
  }
};

router.post("/login/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      error: "Identification token not provided",
    });
  }

  try {
    const ticket = await authClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const providerUserId = payload["sub"];
    const userEmail = payload["email"];

    const providerId = await getProviderId("Google");
    const { userId, refreshTokenVersion } = await findOrCreateUser(
      providerId,
      providerUserId,
      userEmail
    );

    const newAccessToken = jwt.sign({ userId: userId }, JWT_ACCESS_SECRET_KEY, {
      expiresIn: accessTokenDuration,
    });

    const newRefreshToken = jwt.sign(
      { userId: userId, refreshTokenVersion: refreshTokenVersion },
      JWT_REFRESH_SECRET_KEY,
      { expiresIn: refreshTokenDuration }
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Successfully logged in, enjoy your stay",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
      { expiresIn: accessTokenDuration }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        refreshTokenVersion: decoded.refreshTokenVersion,
      },
      JWT_REFRESH_SECRET_KEY,
      { expiresIn: refreshTokenDuration }
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
