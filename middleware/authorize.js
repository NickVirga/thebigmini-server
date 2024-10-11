// const passport = require('passport');
// const passportJWT = require('passport-jwt');
// const JWTStrategy = passportJWT.Strategy;
// // const ExtractJWT = passportJWT.ExtractJwt; 

// // JWT Strategy
// passport.use(new JWTStrategy({
//   jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: process.env.JWT_ACCESS_SECRET_KEY
// }, (jwtPayload, done) => {
//   // Example user lookup, replace with actual DB call
//   const user = { id: jwtPayload.id, name: jwtPayload.name };
//   return done(null, user);
// }));

// // JWT middleware
// const jwtAuth = passport.authenticate('jwt', { session: false });

// module.exports = { jwtAuth };


// require('dotenv').config();
// const jwt = require('jsonwebtoken');

// const authorize = (req, res, next) => {
//     const bearerTokenString = req.headers.authorization;

//     if (!bearerTokenString) {
//         return res.status(401).json({
//             error: "Resource requires Bearer token authorization"
//         })
//     }

//     const splitBearerToken = bearerTokenString.split(" ");

//     if (splitBearerToken.length !== 2) {
//         return res.status(400).json({
//             error: "Bearer token is malformed"
//         })
//     }

//     const bearerToken = splitBearerToken[1];

//     jwt.verify(bearerToken, process.env.JWT_ACCESS_SECRET_KEY, (err, payload) => {
//         if (err) {
//             return res.status(401).json({
//                 error: "Invalid JWT"
//             })
//         }
//         req.userId = payload.userId;

//         next();
//     })
// }

// module.exports = authorize;