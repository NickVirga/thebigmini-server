const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json());

const authRoutes = require("./routes/auth-routes");
const usersRoutes = require("./routes/users-routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });