import { logger } from "../utils/logger.js"
import Email from "../models/Email.js"
import aiService from "./aiService.js"

class PriorityQueue {
  constructor() {
    this.queue = []
    this.processing = false
    this.maxConcurrent = 3
    this.currentProcessing = 0
  }

  async addEmail(emailId, priority = "medium") {
    try {
      const email = await Email.findById(emailId)
      if (!email) {
        logger.error(`❌ Email not found: ${emailId}`)
        return
      }

      const queueItem = {
        emailId,
        priority: this.getPriorityWeight(priority),
        addedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      }

      // Insert in priority order (higher priority first)
      let inserted = false
      for (let i = 0; i < this.queue.length; i++) {
        if (queueItem.priority > this.queue[i].priority) {
          this.queue.splice(i, 0, queueItem)
          inserted = true
          break
        }
      }

      if (!inserted) {
        this.queue.push(queueItem)
      }

      logger.info(`📋 Added email to priority queue: ${email.subject} (Priority: ${priority})`)

      // Start processing if not already running
      if (!this.processing) {
        this.startProcessing()
      }
    } catch (error) {
      logger.error("❌ Failed to add email to priority queue:", error.message)
    }
  }

  getPriorityWeight(priority) {
    const weights = {
      urgent: 10,
      high: 7,
      medium: 5,
      low: 2,
    }
    return weights[priority] || 5
  }

  async startProcessing() {
    if (this.processing) return

    this.processing = true
    logger.info("🚀 Starting priority queue processing")

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const item = this.queue.shift()
      this.processEmailItem(item)
    }

    if (this.queue.length === 0 && this.currentProcessing === 0) {
      this.processing = false
      logger.info("✅ Priority queue processing completed")
    }
  }

  async processEmailItem(item) {
    this.currentProcessing++

    try {
      logger.info(`🔄 Processing email from queue: ${item.emailId}`)

      const email = await Email.findById(item.emailId)
      if (!email) {
        logger.error(`❌ Email not found during processing: ${item.emailId}`)
        return
      }

      // Update email status
      email.status = "in-progress"
      await email.save()

      // Process with AI
      const aiResults = await aiService.processEmailWithAI(email)

      // Update email with AI results
      email.sentiment = aiResults.sentiment
      email.category = aiResults.category
      email.priority = aiResults.priority
      email.extractedDetails = aiResults.extractedDetails
      email.processedAt = new Date()
      email.processingTime = aiResults.processingTime

      // Generate AI response
      const aiResponse = await aiService.generateResponse(email, "professional")
      email.aiResponse = aiResponse

      // Update status based on priority
      if (email.priority.level === "urgent") {
        email.status = "pending" // Keep urgent emails as pending for immediate attention
      } else {
        email.status = "pending" // All emails remain pending until manually resolved
      }

      await email.save()

      logger.info(`✅ Email processing completed: ${email.subject}`)

      // Emit event for real-time updates (if using WebSocket)
      this.emitProcessingUpdate(email)
    } catch (error) {
      logger.error(`❌ Failed to process email ${item.emailId}:`, error.message)

      // Retry logic
      if (item.retryCount < item.maxRetries) {
        item.retryCount++
        item.priority = Math.max(1, item.priority - 1) // Lower priority on retry

        // Add back to queue for retry
        setTimeout(() => {
          this.queue.push(item)
          logger.info(`🔄 Retrying email processing: ${item.emailId} (Attempt ${item.retryCount + 1})`)
        }, 5000 * item.retryCount) // Exponential backoff
      } else {
        logger.error(`❌ Max retries exceeded for email: ${item.emailId}`)

        // Mark email as failed
        try {
          await Email.findByIdAndUpdate(item.emailId, {
            status: "pending",
            processingError: error.message,
          })
        } catch (updateError) {
          logger.error("❌ Failed to update email with error status:", updateError.message)
        }
      }
    } finally {
      this.currentProcessing--

      // Continue processing if there are more items
      if (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
        const nextItem = this.queue.shift()
        this.processEmailItem(nextItem)
      }

      // Check if processing is complete
      if (this.queue.length === 0 && this.currentProcessing === 0) {
        this.processing = false
        logger.info("✅ Priority queue processing completed")
      }
    }
  }

  emitProcessingUpdate(email) {
    // Placeholder for WebSocket/SSE implementation
    logger.info(`📡 Email processing update: ${email._id} - ${email.status}`)
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      currentProcessing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent,
      queueItems: this.queue.map((item) => ({
        emailId: item.emailId,
        priority: item.priority,
        addedAt: item.addedAt,
        retryCount: item.retryCount,
      })),
    }
  }

  async processUrgentEmails() {
    try {
      // Find all urgent emails that haven't been processed
      const urgentEmails = await Email.find({
        "priority.level": "urgent",
        status: "pending",
        processedAt: null,
      }).sort({ dateReceived: 1 })

      logger.info(`🚨 Found ${urgentEmails.length} urgent emails to process`)

      for (const email of urgentEmails) {
        await this.addEmail(email._id, "urgent")
      }
    } catch (error) {
      logger.error("❌ Failed to process urgent emails:", error.message)
    }
  }

  clearQueue() {
    this.queue = []
    logger.info("🗑️ Priority queue cleared")
  }
}

export default new PriorityQueue()
