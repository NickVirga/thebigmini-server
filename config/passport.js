const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter-oauth2").Strategy;
const { getProviderId, findOrCreateUser } = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const accessTokenDuration = "15m";
const refreshTokenDuration = "30d";

// // Google OAuth Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       // Find or create user in database
//       // let user = await User.findOrCreate(profile);
//       done(null, user);
//     }
//   )
// );

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
            expiresIn: accessTokenDuration,
          }
        );

        const newRefreshToken = jwt.sign(
          { userId: userId, refreshTokenVersion: refreshTokenVersion },
          process.env.JWT_REFRESH_SECRET_KEY,
          { expiresIn: refreshTokenDuration }
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
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_OAUTH_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/facebook/callback`,
      profileFields: ["id", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      //ignore accessToken and refreshToken (used for API calls)

      try {
        const providerId = await getProviderId("Facebook");
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
            expiresIn: accessTokenDuration,
          }
        );

        const newRefreshToken = jwt.sign(
          { userId: userId, refreshTokenVersion: refreshTokenVersion },
          process.env.JWT_REFRESH_SECRET_KEY,
          { expiresIn: refreshTokenDuration }
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

// Twitter OAuth Strategy (X)
passport.use(
  new TwitterStrategy(
    {
      clientID: process.env.TWITTER_OAUTH_CLIENT_ID,
      clientSecret: process.env.TWITTER_OAUTH_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_BASE_URL}/api/auth/facebook/callback`,
      scope: ['tweet.read', 'tweet.write', 'users.read']
    },
    function (accessToken, refreshToken, profile, done) {
      const user = {
        twitterId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        profileImage: profile.photos[0].value,
      };

      const jwtToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

    return done(null, { ...user, jwtToken });
    }
    // async (token, tokenSecret, profile, cb) => {
    //   console.log("try twitter strat")

    //   try {
    //     const providerId = await getProviderId("XTwitter");
    //     const providerUserId = profile.id;
    //     const userEmail = profile.emails[0].value;

    //     const { userId, refreshTokenVersion } = await findOrCreateUser(
    //       providerId,
    //       providerUserId,
    //       userEmail
    //     );

    //     const newAccessToken = jwt.sign(
    //       { userId: userId },
    //       process.env.JWT_ACCESS_SECRET_KEY,
    //       {
    //         expiresIn: accessTokenDuration,
    //       }
    //     );

    //     const newRefreshToken = jwt.sign(
    //       { userId: userId, refreshTokenVersion: refreshTokenVersion },
    //       process.env.JWT_REFRESH_SECRET_KEY,
    //       { expiresIn: refreshTokenDuration }
    //     );

    //     cb(null, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    //   } catch (err) {

    //     cb(err);
    //   }
    // }
  )
);
