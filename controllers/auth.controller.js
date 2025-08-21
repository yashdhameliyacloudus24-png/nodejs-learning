const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

const REFRESH_COOKIE_NAME = "rt";
const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sevenDaysMs,
    path: "/",
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "name, email, password required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccess = signAccessToken(payload.sub);
    const newRefresh = signRefreshToken(payload.sub); // rotation
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken: newAccess });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

const logout = async (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  res.json({ message: "Logged out" });
};

module.exports = { register, login, refresh, logout };
