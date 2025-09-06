import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { body, validationResult } from "express-validator"
import DOMPurify from "isomorphic-dompurify"
import { logger } from "../utils/logger.js"

// Enhanced rate limiting for different endpoints
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || "Too many requests from this IP",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`)
      res.status(429).json({
        success: false,
        error: message || "Too many requests from this IP",
        retryAfter: Math.ceil(windowMs / 1000),
      })
    },
  })
}

// Specific rate limits for different operations
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts, please try again later",
)

export const emailFetchRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests
  "Too many email fetch requests, please slow down",
)

export const aiProcessingRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  20, // 20 requests
  "Too many AI processing requests, please wait",
)

// Enhanced security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body)
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query)
    }

    next()
  } catch (error) {
    logger.error("❌ Input sanitization failed:", error.message)
    res.status(400).json({
      success: false,
      error: "Invalid input data",
    })
  }
}

function sanitizeObject(obj) {
  const sanitized = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Remove potential XSS and clean HTML
      sanitized[key] = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      }).trim()
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? DOMPurify.sanitize(item, {
              ALLOWED_TAGS: [],
              ALLOWED_ATTR: [],
            }).trim()
          : item,
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Validation middleware
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.warn("❌ Validation failed:", {
        errors: errors.array(),
        ip: req.ip,
        path: req.path,
      })

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      })
    }

    next()
  }
}

// Common validation rules
export const emailValidation = [
  body("to").isEmail().normalizeEmail().withMessage("Valid email address required"),
  body("subject").isLength({ min: 1, max: 500 }).trim().withMessage("Subject must be 1-500 characters"),
  body("content").isLength({ min: 1, max: 50000 }).withMessage("Content must be 1-50000 characters"),
]

export const idValidation = [body("id").isMongoId().withMessage("Valid MongoDB ID required")]

// Security logging middleware
export const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /eval\(/i,
    /union.*select/i,
    /drop.*table/i,
  ]

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  })

  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(requestData))

  if (isSuspicious) {
    logger.warn("🚨 Suspicious request detected:", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      method: req.method,
      data: requestData,
    })
  }

  next()
}

// CORS security middleware
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? (process.env.ALLOWED_ORIGINS || "").split(",")
        : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn(`🚫 CORS blocked origin: ${origin}`)
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Key"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400, // 24 hours
}

// Request size limiting
export const requestSizeLimit = {
  json: { limit: "10mb" },
  urlencoded: { limit: "10mb", extended: true },
}

// IP whitelist middleware (for admin operations)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.warn(`🚫 IP not whitelisted: ${clientIP}`)
      return res.status(403).json({
        success: false,
        error: "Access denied from this IP address",
      })
    }

    next()
  }
}
