const router = require("express").Router();
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");

dotenv.config();

const accessTokenDuration = "15m";
const refreshTokenDuration = "7d";

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

const transporter = nodemailer.createTransport({
  SES: { ses: sesClient, aws: { SendRawEmailCommand } },
});

router.post("/signup", async (req, res) => {

  const requiredSignupProperties = ["email", "password"];

  const hasAllProperties = (obj, props) => {
    for (let i = 0; i < props.length; i++) {
      if (!obj.hasOwnProperty(props[i])) return false;
    }
    return true;
  };

  if (!hasAllProperties(req.body, requiredSignupProperties)) {
    res.status(400).json({
      message: `One or more missing properties in request body.`,
    });
    return;
  }

  const { email, password } = req.body;

  try {
    const existingUser = await knex("users").where({ email }).first();

    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const id = uuidv4();

    const verificationToken = jwt.sign(
      { id: id },
      process.env.JWT_EMAIL_VERFICATION_SECRET_KEY,
      { expiresIn: "1h" }
    );
    const verificationUrl = `${process.env.CORS_ORIGIN}/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.VERIFICATION_EMAIL_ADDRESS,
      to: email,
      subject: "The BIGmini Crossword - Email Verification",
      html: `<p style="margin: 20px 0">Thank you for signing up for The BIGmini Crossword. Click the following link within 24 hours to activate your account:</p>
            <p style="margin: 20px 0"><a href="${verificationUrl}" target="_blank">${verificationUrl}</a></p>
            <p style="margin: 20px 0">Once activated, your stats will beign to be tracked.</p>`,
    };
    
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Error sending verification email" });
      } else  {

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: id,
        email: req.body.email,
        password: hashedPassword,
        isVerified: false,
      };
  
      await knex("users").insert(newUser);

      return res
        .status(201)
        .json({ message: "Verification email sent. Please check your inbox." });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to create new user." });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(
      token,
      process.env.JWT_EMAIL_VERFICATION_SECRET_KEY
    );
    const userId = decoded.id;

    const user = await knex("users").where({ id: userId }).first();

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    await knex("users").where({ id: userId }).update({ isVerified: true });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to verify email" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Login requires email and password",
    });
  }

  try {
    const foundUsers = await knex("users").where({ email: email });

    if (foundUsers.length === 0) {
      return res.status(401).json({
        error: "Invalid login credentials",
      });
    }

    const matchingUser = foundUsers[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      matchingUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid login credentials",
      });
    }

    const accessToken = jwt.sign(
      { user_id: matchingUser.id },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: accessTokenDuration }
    );

    const refreshToken = jwt.sign(
      { user_id: matchingUser.id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: refreshTokenDuration }
    );

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Successfully logged in, enjoy your stay",
    });
  } catch (err) {
    console.log(err);
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
      process.env.JWT_REFRESH_SECRET_KEY
    );
    const accessToken = jwt.sign(
      { user_id: decoded.user_id },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: accessTokenDuration }
    );
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;
