require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const productRoute = require("./routes/product.route.js");
const authRoute = require("./routes/auth.route.js");

const app = express();

// security / misc
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // allow cookies
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// body & cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute); // we'll protect mutating routes inside

// db + start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database!");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server listening on ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error("Connection failed!", err);
    process.exit(1);
  });
