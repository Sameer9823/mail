import jwt from "jsonwebtoken"
import { logger } from "../utils/logger.js"

export const authenticate = (req, res, next) => {
  let token

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    logger.error("❌ Token verification failed:", error.message)
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Access denied. Please authenticate.",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions.",
      })
    }

    next()
  }
}
