import express from "express"
import Email from "../models/Email.js"
import gmailService from "../services/gmailService.js"
import emailProcessor from "../services/emailProcessor.js"
import aiService from "../services/aiService.js"
import priorityQueue from "../services/priorityQueue.js"
import { validateEmailFetch, validateEmailSend, validateEmailList } from "../middleware/validation.js"
import { logger } from "../utils/logger.js"

const router = express.Router()

// GET /api/emails/fetch - Fetch and filter emails from Gmail API
router.get("/fetch", validateEmailFetch, async (req, res) => {
  try {
    const { maxResults, query, labelIds, includeSpamTrash } = req.validatedQuery

    logger.info(`📧 Fetching emails from Gmail API`)

    // Process new emails from Gmail
    const result = await emailProcessor.processNewEmails({
      maxResults,
      query,
      labelIds,
      includeSpamTrash,
    })

    res.json({
      success: true,
      message: "Emails fetched and processed successfully",
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Failed to fetch emails:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to fetch emails",
      message: error.message,
    })
  }
})

// POST /api/emails/store - Save emails in MongoDB (manual email creation)
router.post("/store", async (req, res) => {
  try {
    const emailData = req.body

    // Validate required fields
    if (!emailData.messageId || !emailData.subject || !emailData.content || !emailData.sender) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["messageId", "subject", "content", "sender"],
      })
    }

    // Check if email already exists
    const existingEmail = await Email.findOne({ messageId: emailData.messageId })
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: "Email already exists",
        emailId: existingEmail._id,
      })
    }

    // Process email data with AI
    const processedData = await emailProcessor.enrichEmailData(emailData)

    // Create and save email
    const email = new Email(processedData)
    await email.save()

    // Add to priority queue for AI processing
    await priorityQueue.addEmail(email._id, email.priority.level)

    logger.info(`✅ Email stored successfully: ${email.subject}`)

    res.status(201).json({
      success: true,
      message: "Email stored successfully",
      data: {
        emailId: email._id,
        subject: email.subject,
        status: email.status,
        priority: email.priority.level,
      },
    })
  } catch (error) {
    logger.error("❌ Failed to store email:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to store email",
      message: error.message,
    })
  }
})

// GET /api/emails/list - List emails with filters
router.get("/list", validateEmailList, async (req, res) => {
  try {
    const { page, limit, status, sentiment, priority, category, search, sortBy, sortOrder } = req.validatedQuery

    // Build filter query
    const filter = {}

    if (status) filter.status = status
    if (sentiment) filter["sentiment.label"] = sentiment
    if (priority) filter["priority.level"] = priority
    if (category) filter["category.id"] = category

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "sender.email": { $regex: search, $options: "i" } },
      ]
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [emails, totalCount] = await Promise.all([
      Email.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Email.countDocuments(filter),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    logger.info(`📋 Listed ${emails.length} emails (page ${page}/${totalPages})`)

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          status,
          sentiment,
          priority,
          category,
          search,
        },
      },
    })
  } catch (error) {
    logger.error("❌ Failed to list emails:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to list emails",
      message: error.message,
    })
  }
})

// GET /api/emails/:id - Get single email by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const email = await Email.findById(id)
    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      })
    }

    res.json({
      success: true,
      data: email,
    })
  } catch (error) {
    logger.error("❌ Failed to get email:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get email",
      message: error.message,
    })
  }
})

// POST /api/emails/:id/respond - Generate AI draft reply and store it
router.post("/:id/respond", async (req, res) => {
  try {
    const { id } = req.params
    const { tone = "professional", regenerate = false } = req.body

    const email = await Email.findById(id)
    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      })
    }

    // Check if response already exists and regenerate is not requested
    if (email.aiResponse && !regenerate) {
      return res.json({
        success: true,
        message: "AI response already exists",
        data: email.aiResponse,
        cached: true,
      })
    }

    logger.info(`🤖 Generating AI response for email: ${email.subject}`)

    // Generate AI response
    const aiResponse = await aiService.generateResponse(email, tone)

    // Update email with AI response
    email.aiResponse = aiResponse
    await email.save()

    logger.info(`✅ AI response generated and stored for email: ${id}`)

    res.json({
      success: true,
      message: "AI response generated successfully",
      data: aiResponse,
      cached: false,
    })
  } catch (error) {
    logger.error("❌ Failed to generate AI response:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to generate AI response",
      message: error.message,
    })
  }
})

// POST /api/emails/:id/send - Send email reply via Gmail API
router.post("/:id/send", validateEmailSend, async (req, res) => {
  try {
    const { id } = req.params
    const { to, subject, content, useAIResponse = false } = req.validatedBody

    const email = await Email.findById(id)
    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      })
    }

    let emailContent = content
    let emailSubject = subject

    // Use AI response if requested and available
    if (useAIResponse && email.aiResponse) {
      emailContent = email.aiResponse.content
      emailSubject = email.aiResponse.subject
    }

    logger.info(`📤 Sending email reply for: ${email.subject}`)

    // Send email via Gmail API
    const sentEmail = await gmailService.sendEmail({
      to: to || email.sender.email,
      subject: emailSubject,
      content: emailContent,
      replyToMessageId: email.gmailMessageId,
    })

    // Update email status
    email.status = "resolved"
    email.processedAt = new Date()
    await email.save()

    logger.info(`✅ Email reply sent successfully: ${sentEmail.id}`)

    res.json({
      success: true,
      message: "Email reply sent successfully",
      data: {
        sentEmailId: sentEmail.id,
        threadId: sentEmail.threadId,
        to: to || email.sender.email,
        subject: emailSubject,
      },
    })
  } catch (error) {
    logger.error("❌ Failed to send email reply:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to send email reply",
      message: error.message,
    })
  }
})

// PATCH /api/emails/:id/status - Update email status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ["pending", "in-progress", "resolved", "archived"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
        validStatuses,
      })
    }

    const email = await Email.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "resolved" && { processedAt: new Date() }),
      },
      { new: true },
    )

    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      })
    }

    logger.info(`📝 Email status updated: ${id} -> ${status}`)

    res.json({
      success: true,
      message: "Email status updated successfully",
      data: {
        emailId: email._id,
        status: email.status,
        processedAt: email.processedAt,
      },
    })
  } catch (error) {
    logger.error("❌ Failed to update email status:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to update email status",
      message: error.message,
    })
  }
})

// POST /api/emails/:id/reprocess - Reprocess email with AI
router.post("/:id/reprocess", async (req, res) => {
  try {
    const { id } = req.params

    const email = await Email.findById(id)
    if (!email) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      })
    }

    logger.info(`🔄 Reprocessing email with AI: ${email.subject}`)

    // Add to priority queue for reprocessing
    await priorityQueue.addEmail(email._id, email.priority.level)

    res.json({
      success: true,
      message: "Email added to reprocessing queue",
      data: {
        emailId: email._id,
        queueStatus: priorityQueue.getQueueStatus(),
      },
    })
  } catch (error) {
    logger.error("❌ Failed to reprocess email:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to reprocess email",
      message: error.message,
    })
  }
})

// GET /api/emails/queue/status - Get processing queue status
router.get("/queue/status", async (req, res) => {
  try {
    const queueStatus = priorityQueue.getQueueStatus()
    const processingStats = await emailProcessor.getProcessingStats()

    res.json({
      success: true,
      data: {
        queue: queueStatus,
        processing: processingStats,
      },
    })
  } catch (error) {
    logger.error("❌ Failed to get queue status:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get queue status",
      message: error.message,
    })
  }
})

export default router
