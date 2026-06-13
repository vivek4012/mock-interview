import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { generateTokenPair } from "../utils/jwt.js";
import { config } from "../config/config.js";
console.log(config, "config");

// STEP 1: Redirect user to Google's consent screen
export const googleAuth = (req, res) => {
  const redirect_uri = config.GOOGLE_REDIRECT_URI;
  const client_id = config.GOOGLE_CLIENT_ID;

  const scope = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(authUrl);
};

// STEP 2: Handle Google redirect callback
export const googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange authorization code for access token
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token } = tokenRes.data;

    // Fetch user profile
    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const { id, email, name, given_name, family_name, picture } = userRes.data;

    // Check or create user
    let user = await User.findOne({ googleId: id });

    if (!user) {
      try {
        user = await User.create({
          googleId: id,
          email,
          firstName: given_name || name?.split(" ")[0] || "User",
          lastName: family_name || name?.split(" ")[1] || "",
          profilePicture: picture,
          authProvider: "google",
        });
      } catch (createError) {
        if (createError.errors) {
          Object.keys(createError.errors).forEach((key) => {
            console.error(`  - ${key}: ${createError.errors[key].message}`);
          });
        }
        throw createError;
      }
    }

    // Generate JWT token pair
    const { accessToken, refreshToken, expiresIn } = generateTokenPair(user);

    // Send token to frontend (option 1: via redirect param)
    res.redirect(`${config.CLIENT_URL}/auth/success?token=${accessToken}`);
  } catch (error) {
    console.error("=== ERROR DURING GOOGLE OAUTH ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
    }
    res.redirect(`${config.CLIENT_URL}/auth/error`);
  }
};

// STEP 3: Verify JWT and return user info
export const getUserInfo = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT.SECRET, {
      issuer: "mock-interview-platform",
      audience: "mock-interview-users",
    });

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};
