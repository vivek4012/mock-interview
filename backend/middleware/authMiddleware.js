
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import  User  from '../models/user.js';
import { createError } from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next(createError(401, 'Access token is required'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return next(createError(401, 'User not found'));
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.message.includes('expired')) {
      return next(createError(401, 'Access token has expired'));
    }
    return next(createError(401, 'Invalid access token'));
  }
};