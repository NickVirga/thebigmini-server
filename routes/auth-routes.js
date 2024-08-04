const router = require("express").Router();
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

const { GOOGLE_OAUTH_CLIENT_ID, JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } = process.env;

const authClient = new OAuth2Client(GOOGLE_OAUTH_CLIENT_ID);

const accessTokenDuration = "15m";
const refreshTokenDuration = "7d";

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

const findOrCreateUser = async (providerId, providerUserId) => {
  let user = await knex("users")
    .where({ provider_user_id: providerUserId, provider_id: providerId })
    .first();

  if (!user) {
    const userId = uuidv4();
    await knex("users").insert({
      id: userId,
      provider_id: providerId,
      provider_user_id: providerUserId,
    });
    return userId;
  } else {
    return user.id;
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

    const providerId = await getProviderId("Google");
    const userId = await findOrCreateUser(providerId, providerUserId);

    const accessToken = jwt.sign(
      { user_id:userId },
      JWT_ACCESS_SECRET_KEY,
      { expiresIn: accessTokenDuration }
    );

    const refreshToken = jwt.sign(
      { user_id: userId },
      JWT_REFRESH_SECRET_KEY,
      { expiresIn: refreshTokenDuration }
    );

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Successfully logged in, enjoy your stay",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET_KEY
    );
    const accessToken = jwt.sign(
      { user_id: decoded.user_id },
      JWT_ACCESS_SECRET_KEY,
      { expiresIn: accessTokenDuration }
    );
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;
