import Joi from "joi"
import { logger } from "../utils/logger.js"

export const validateEmailFetch = (req, res, next) => {
  const schema = Joi.object({
    maxResults: Joi.number().integer().min(1).max(100).default(50),
    query: Joi.string().allow("").default(""),
    labelIds: Joi.array().items(Joi.string()).default([]),
    includeSpamTrash: Joi.boolean().default(false),
  })

  const { error, value } = schema.validate(req.query)

  if (error) {
    logger.warn("❌ Email fetch validation failed:", error.details[0].message)
    return res.status(400).json({
      error: "Validation failed",
      details: error.details[0].message,
    })
  }

  req.validatedQuery = value
  next()
}

export const validateEmailSend = (req, res, next) => {
  const schema = Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().min(1).max(500).required(),
    content: Joi.string().min(1).max(50000).required(),
    replyToMessageId: Joi.string().optional(),
  })

  const { error, value } = schema.validate(req.body)

  if (error) {
    logger.warn("❌ Email send validation failed:", error.details[0].message)
    return res.status(400).json({
      error: "Validation failed",
      details: error.details[0].message,
    })
  }

  req.validatedBody = value
  next()
}

export const validateEmailList = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid("pending", "in-progress", "resolved", "archived").optional(),
    sentiment: Joi.string().valid("positive", "negative", "neutral").optional(),
    priority: Joi.string().valid("low", "medium", "high", "urgent").optional(),
    category: Joi.string().optional(),
    search: Joi.string().allow("").optional(),
    sortBy: Joi.string()
      .valid("dateReceived", "priority.score", "sentiment.score", "createdAt")
      .default("dateReceived"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  })

  const { error, value } = schema.validate(req.query)

  if (error) {
    logger.warn("❌ Email list validation failed:", error.details[0].message)
    return res.status(400).json({
      error: "Validation failed",
      details: error.details[0].message,
    })
  }

  req.validatedQuery = value
  next()
}
