import Email from "../models/Email.js"
import gmailService from "./gmailService.js"
import { logger } from "../utils/logger.js"

class EmailProcessor {
  constructor() {
    this.isProcessing = false
    this.processingQueue = []
  }

  async processNewEmails(options = {}) {
    if (this.isProcessing) {
      logger.warn("⚠️ Email processing already in progress")
      return { message: "Processing already in progress" }
    }

    this.isProcessing = true
    const startTime = Date.now()

    try {
      logger.info("🔄 Starting email processing...")

      // Fetch emails from Gmail
      const gmailEmails = await gmailService.fetchEmails(options)

      if (gmailEmails.length === 0) {
        logger.info("📭 No new emails found")
        return { processed: 0, skipped: 0, errors: 0 }
      }

      let processed = 0
      let skipped = 0
      let errors = 0

      // Process each email
      for (const emailData of gmailEmails) {
        try {
          // Check if email already exists
          const existingEmail = await Email.findOne({
            messageId: emailData.messageId,
          })

          if (existingEmail) {
            skipped++
            continue
          }

          // Add initial AI analysis placeholders
          const processedEmail = await this.enrichEmailData(emailData)

          // Save to database
          const email = new Email(processedEmail)
          await email.save()

          // Add to processing queue for AI analysis
          this.processingQueue.push(email._id)

          processed++
          logger.info(`✅ Processed email: ${emailData.subject}`)
        } catch (error) {
          errors++
          logger.error(`❌ Failed to process email "${emailData.subject}":`, error.message)
        }
      }

      const processingTime = Date.now() - startTime
      logger.info(`🎉 Email processing completed in ${processingTime}ms`)
      logger.info(`📊 Results: ${processed} processed, ${skipped} skipped, ${errors} errors`)

      // Start AI processing in background
      if (this.processingQueue.length > 0) {
        this.processAIAnalysisQueue()
      }

      return { processed, skipped, errors, processingTime }
    } catch (error) {
      logger.error("❌ Email processing failed:", error.message)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  async enrichEmailData(emailData) {
    // Add basic sentiment analysis (will be enhanced by AI service)
    const sentiment = this.basicSentimentAnalysis(emailData.content)

    // Add basic priority detection
    const priority = this.basicPriorityDetection(emailData.subject, emailData.content)

    // Add basic categorization
    const category = this.basicCategorization(emailData.subject, emailData.content)

    // Extract basic details
    const extractedDetails = this.extractBasicDetails(emailData.content)

    return {
      ...emailData,
      sentiment,
      priority,
      category,
      extractedDetails,
      status: "pending",
      tags: this.extractTags(emailData.subject, emailData.content),
    }
  }

  basicSentimentAnalysis(content) {
    const positiveWords = ["thank", "great", "excellent", "good", "happy", "satisfied", "love", "amazing"]
    const negativeWords = ["problem", "issue", "error", "bug", "broken", "failed", "wrong", "terrible", "hate", "angry"]
    const urgentWords = ["urgent", "critical", "emergency", "asap", "immediately", "quickly"]

    const lowerContent = content.toLowerCase()

    let positiveCount = 0
    let negativeCount = 0
    let urgentCount = 0

    positiveWords.forEach((word) => {
      if (lowerContent.includes(word)) positiveCount++
    })

    negativeWords.forEach((word) => {
      if (lowerContent.includes(word)) negativeCount++
    })

    urgentWords.forEach((word) => {
      if (lowerContent.includes(word)) urgentCount++
    })

    let label = "neutral"
    let score = 0

    if (positiveCount > negativeCount) {
      label = "positive"
      score = Math.min(0.8, positiveCount * 0.2)
    } else if (negativeCount > positiveCount) {
      label = "negative"
      score = Math.max(-0.8, -negativeCount * 0.2)
    }

    const urgency = urgentCount > 0 ? "high" : negativeCount > 2 ? "medium" : "low"

    return {
      score,
      label,
      confidence: 0.6, // Basic analysis has lower confidence
      urgency,
      emotions: [],
    }
  }

  basicPriorityDetection(subject, content) {
    const urgentKeywords = ["urgent", "critical", "emergency", "asap", "immediately", "high priority"]
    const highKeywords = ["important", "quickly", "soon", "deadline", "time-sensitive"]

    const text = `${subject} ${content}`.toLowerCase()

    let score = 3 // Default medium priority
    let level = "medium"

    urgentKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score = Math.min(10, score + 3)
      }
    })

    highKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score = Math.min(10, score + 1)
      }
    })

    if (score >= 8) level = "urgent"
    else if (score >= 6) level = "high"
    else if (score <= 2) level = "low"

    return {
      level,
      score,
      factors: [],
    }
  }

  basicCategorization(subject, content) {
    const categories = {
      "technical-support": ["bug", "error", "technical", "code", "api", "integration"],
      billing: ["billing", "payment", "invoice", "charge", "subscription", "refund"],
      "general-inquiry": ["question", "inquiry", "information", "help", "how to"],
      "feature-request": ["feature", "request", "enhancement", "suggestion", "improvement"],
      complaint: ["complaint", "dissatisfied", "unhappy", "problem", "issue"],
    }

    const text = `${subject} ${content}`.toLowerCase()

    for (const [categoryId, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            id: categoryId,
            name: categoryId.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            confidence: 0.7,
          }
        }
      }
    }

    return {
      id: "general-inquiry",
      name: "General Inquiry",
      confidence: 0.5,
    }
  }

  extractBasicDetails(content) {
    // Extract basic keywords
    const words = content.toLowerCase().match(/\b\w+\b/g) || []
    const keywords = words
      .filter(
        (word) =>
          word.length > 3 && !["this", "that", "with", "have", "will", "from", "they", "been", "were"].includes(word),
      )
      .slice(0, 10)

    // Estimate reading time (average 200 words per minute)
    const wordCount = words.length
    const readingTime = Math.ceil(wordCount / 200)

    return {
      keywords,
      entities: [],
      topics: [],
      language: "en",
      readingTime,
    }
  }

  extractTags(subject, content) {
    const tags = []
    const text = `${subject} ${content}`.toLowerCase()

    // Add tags based on content
    if (text.includes("urgent") || text.includes("critical")) tags.push("urgent")
    if (text.includes("bug") || text.includes("error")) tags.push("bug-report")
    if (text.includes("feature") || text.includes("request")) tags.push("feature-request")
    if (text.includes("billing") || text.includes("payment")) tags.push("billing")
    if (text.includes("api") || text.includes("integration")) tags.push("technical")

    return tags
  }

  async processAIAnalysisQueue() {
    logger.info(`🤖 Starting AI analysis for ${this.processingQueue.length} emails`)

    // Process queue in background (placeholder for AI service integration)
    // This will be implemented in the next task
    setTimeout(() => {
      logger.info("🎯 AI analysis queue processing completed")
      this.processingQueue = []
    }, 1000)
  }

  async getProcessingStats() {
    try {
      const stats = await Email.getStats()
      const sentimentDistribution = await Email.getSentimentDistribution()
      const priorityDistribution = await Email.getPriorityDistribution()

      return {
        ...stats,
        sentimentDistribution,
        priorityDistribution,
        queueLength: this.processingQueue.length,
        isProcessing: this.isProcessing,
      }
    } catch (error) {
      logger.error("❌ Failed to get processing stats:", error.message)
      throw error
    }
  }
}

export default new EmailProcessor()
