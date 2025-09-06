import { logger } from "../utils/logger.js"

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`)
  error.status = 404
  next(error)
}

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error("API Error:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  })

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Invalid ID format"
    error = { message, status: 400 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered"
    error = { message, status: 400 }
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")
    error = { message, status: 400 }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token"
    error = { message, status: 401 }
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired"
    error = { message, status: 401 }
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  })
}
