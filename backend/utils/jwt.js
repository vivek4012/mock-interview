import jwt from "jsonwebtoken";
import crypto from "crypto";
import {config} from '../config/config.js'

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT.SECRET, {
    expiresIn: "1h",
    issuer: "mock-interview-platform",
    audience: "mock-interview-users",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT.REFRESH_SECRET, {
    expiresIn: "7d",
    issuer: "mock-interview-platform",
    audience: "mock-interview-users",
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT.SECRET, {
      issuer: "mock-interview-platform",
      audience: "mock-interview-users",
    });
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT.REFRESH_SECRET, {
      issuer: "mock-interview-platform",
      audience: "mock-interview-users",
    });
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user._id });

  return {
    accessToken,
    refreshToken,
    expiresIn: 60 * 60,
  };
};

export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};
