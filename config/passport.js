const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const FacebookStrategy = require("passport-facebook").Strategy;
const { Strategy: DiscordStrategy } = require("passport-discord");
const { getProviderId, findOrCreateUser } = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const {
  ACCESS_TOKEN_DURATION,
  REFRESH_TOKEN_DURATION,
} = process.env;

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      //ignore accessToken and refreshToken (used for API calls)

      try {
        const providerId = await getProviderId("Google");
        const providerUserId = profile.id;
        const userEmail = profile.emails[0].value;

        const { userId, refreshTokenVersion } = await findOrCreateUser(
          providerId,
          providerUserId,
          userEmail
        );

        const newAccessToken = jwt.sign(
          { userId: userId },
          process.env.JWT_ACCESS_SECRET_KEY,
          {
            expiresIn: ACCESS_TOKEN_DURATION,
          }
        );

        const newRefreshToken = jwt.sign(
          { userId: userId, refreshTokenVersion: refreshTokenVersion },
          process.env.JWT_REFRESH_SECRET_KEY,
          { expiresIn: REFRESH_TOKEN_DURATION }
        );

        done(null, {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

// Discord OAuth Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_OAUTH_CLIENT_ID,
      clientSecret: process.env.DISCORD_OAUTH_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      //ignore accessToken and refreshToken (used for API calls)

      try {
        const providerId = await getProviderId("Discord");
        const providerUserId = profile.id;
        const userEmail = profile.email;

        const { userId, refreshTokenVersion } = await findOrCreateUser(
          providerId,
          providerUserId,
          userEmail
        );

        const newAccessToken = jwt.sign(
          { userId: userId },
          process.env.JWT_ACCESS_SECRET_KEY,
          {
            expiresIn: ACCESS_TOKEN_DURATION,
          }
        );

        const newRefreshToken = jwt.sign(
          { userId: userId, refreshTokenVersion: refreshTokenVersion },
          process.env.JWT_REFRESH_SECRET_KEY,
          { expiresIn: REFRESH_TOKEN_DURATION }
        );

        done(null, {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

// Facebook OAuth Strategy
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_OAUTH_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
//       callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/facebook/callback`,
//       profileFields: ["id", "email"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       //ignore accessToken and refreshToken (used for API calls)

//       try {
//         const providerId = await getProviderId("Facebook");
//         const providerUserId = profile.id;
//         const userEmail = profile.emails[0].value;

//         const { userId, refreshTokenVersion } = await findOrCreateUser(
//           providerId,
//           providerUserId,
//           userEmail
//         );

//         const newAccessToken = jwt.sign(
//           { userId: userId },
//           process.env.JWT_ACCESS_SECRET_KEY,
//           {
//             expiresIn: ACCESS_TOKEN_DURATION,
//           }
//         );

//         const newRefreshToken = jwt.sign(
//           { userId: userId, refreshTokenVersion: refreshTokenVersion },
//           process.env.JWT_REFRESH_SECRET_KEY,
//           { expiresIn: REFRESH_TOKEN_DURATION }
//         );

//         done(null, {
//           accessToken: newAccessToken,
//           refreshToken: newRefreshToken,
//         });
//       } catch (err) {
//         done(err);
//       }
//     }
//   )
// );

 