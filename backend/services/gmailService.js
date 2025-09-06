import { google } from "googleapis"
import { logger } from "../utils/logger.js"

class GmailService {
  constructor() {
    this.oauth2Client = null
    this.gmail = null
    this.isAuthenticated = false
    this.initializeAuth()
  }

  initializeAuth() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI,
      )

      // Set refresh token if available
      if (process.env.GMAIL_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        })
        this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client })
        this.isAuthenticated = true
        logger.info("✅ Gmail API initialized with refresh token")
      }
    } catch (error) {
      logger.error("❌ Failed to initialize Gmail API:", error.message)
    }
  }

  getAuthUrl() {
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    })
  }

  async authenticate(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)
      this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client })
      this.isAuthenticated = true

      logger.info("✅ Gmail authentication successful")
      return tokens
    } catch (error) {
      logger.error("❌ Gmail authentication failed:", error.message)
      throw new Error("Gmail authentication failed")
    }
  }

  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      this.oauth2Client.setCredentials(credentials)
      logger.info("🔄 Gmail access token refreshed")
      return credentials
    } catch (error) {
      logger.error("❌ Failed to refresh Gmail token:", error.message)
      throw error
    }
  }

  async fetchEmails(options = {}) {
    if (!this.isAuthenticated) {
      throw new Error("Gmail API not authenticated")
    }

    const { maxResults = 50, query = "", labelIds = [], includeSpamTrash = false } = options

    try {
      // Build Gmail search query
      const searchQuery = this.buildSearchQuery(query)

      logger.info(`📧 Fetching emails with query: ${searchQuery}`)

      // Get message list
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: searchQuery,
        maxResults,
        labelIds,
        includeSpamTrash,
      })

      const messages = response.data.messages || []
      logger.info(`📬 Found ${messages.length} messages`)

      // Fetch full message details
      const emails = []
      for (const message of messages) {
        try {
          const emailData = await this.getEmailDetails(message.id)
          if (emailData) {
            emails.push(emailData)
          }
        } catch (error) {
          logger.error(`❌ Failed to fetch email ${message.id}:`, error.message)
        }
      }

      logger.info(`✅ Successfully processed ${emails.length} emails`)
      return emails
    } catch (error) {
      if (error.code === 401) {
        logger.warn("🔄 Access token expired, refreshing...")
        await this.refreshAccessToken()
        return this.fetchEmails(options)
      }

      logger.error("❌ Failed to fetch emails:", error.message)
      throw error
    }
  }

  buildSearchQuery(customQuery = "") {
    // Keywords to filter support emails
    const supportKeywords = [
      "support",
      "query",
      "request",
      "help",
      "issue",
      "problem",
      "bug",
      "error",
      "assistance",
      "question",
      "inquiry",
      "urgent",
      "critical",
      "emergency",
      "asap",
    ]

    // Build query for support-related emails
    const keywordQuery = supportKeywords.map((keyword) => `(subject:${keyword} OR body:${keyword})`).join(" OR ")

    // Combine with custom query
    let finalQuery = keywordQuery
    if (customQuery) {
      finalQuery = `(${keywordQuery}) AND (${customQuery})`
    }

    // Add time filter (last 30 days by default)
    finalQuery += " newer_than:30d"

    return finalQuery
  }

  async getEmailDetails(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      })

      const message = response.data
      return this.parseEmailMessage(message)
    } catch (error) {
      logger.error(`❌ Failed to get email details for ${messageId}:`, error.message)
      return null
    }
  }

  parseEmailMessage(message) {
    try {
      const headers = message.payload.headers
      const getHeader = (name) => {
        const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
        return header ? header.value : ""
      }

      // Extract basic information
      const messageId = message.id
      const threadId = message.threadId
      const subject = getHeader("Subject") || "No Subject"
      const from = getHeader("From")
      const to = getHeader("To")
      const cc = getHeader("Cc")
      const bcc = getHeader("Bcc")
      const date = getHeader("Date")
      const labelIds = message.labelIds || []

      // Parse sender information
      const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from]
      const senderName = senderMatch[1] ? senderMatch[1].replace(/"/g, "").trim() : from
      const senderEmail = senderMatch[2] || from

      // Extract email content
      const { textContent, htmlContent } = this.extractEmailContent(message.payload)

      // Parse date
      const dateReceived = date ? new Date(date) : new Date()

      // Determine if email is unread
      const isUnread = labelIds.includes("UNREAD")

      return {
        messageId,
        gmailMessageId: messageId,
        threadId,
        subject,
        content: textContent,
        htmlContent,
        sender: {
          name: senderName,
          email: senderEmail.toLowerCase(),
          avatar: null,
        },
        recipient: to,
        cc: cc ? cc.split(",").map((email) => email.trim()) : [],
        bcc: bcc ? bcc.split(",").map((email) => email.trim()) : [],
        dateReceived,
        timestamp: new Date(),
        isRead: !isUnread,
        gmailLabels: labelIds,
        attachments: this.extractAttachments(message.payload),
      }
    } catch (error) {
      logger.error("❌ Failed to parse email message:", error.message)
      return null
    }
  }

  extractEmailContent(payload) {
    let textContent = ""
    let htmlContent = ""

    const extractFromPart = (part) => {
      if (part.mimeType === "text/plain" && part.body.data) {
        textContent += Buffer.from(part.body.data, "base64").toString("utf-8")
      } else if (part.mimeType === "text/html" && part.body.data) {
        htmlContent += Buffer.from(part.body.data, "base64").toString("utf-8")
      } else if (part.parts) {
        part.parts.forEach(extractFromPart)
      }
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPart)
    } else if (payload.body.data) {
      if (payload.mimeType === "text/plain") {
        textContent = Buffer.from(payload.body.data, "base64").toString("utf-8")
      } else if (payload.mimeType === "text/html") {
        htmlContent = Buffer.from(payload.body.data, "base64").toString("utf-8")
      }
    }

    // If no text content, try to extract from HTML
    if (!textContent && htmlContent) {
      textContent = htmlContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    }

    return { textContent, htmlContent }
  }

  extractAttachments(payload) {
    const attachments = []

    const extractFromPart = (part) => {
      if (part.filename && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          contentType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        })
      } else if (part.parts) {
        part.parts.forEach(extractFromPart)
      }
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPart)
    }

    return attachments
  }

  async sendEmail(emailData) {
    if (!this.isAuthenticated) {
      throw new Error("Gmail API not authenticated")
    }

    try {
      const { to, subject, content, replyToMessageId } = emailData

      // Create email message
      const email = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/html; charset=utf-8", "", content].join(
        "\n",
      )

      // Encode email
      const encodedEmail = Buffer.from(email).toString("base64url")

      const requestBody = {
        raw: encodedEmail,
      }

      // Add thread ID if replying
      if (replyToMessageId) {
        const originalMessage = await this.gmail.users.messages.get({
          userId: "me",
          id: replyToMessageId,
        })
        requestBody.threadId = originalMessage.data.threadId
      }

      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody,
      })

      logger.info(`✅ Email sent successfully: ${response.data.id}`)
      return response.data
    } catch (error) {
      logger.error("❌ Failed to send email:", error.message)
      throw error
    }
  }

  async markAsRead(messageId) {
    try {
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      })
      logger.info(`✅ Marked email ${messageId} as read`)
    } catch (error) {
      logger.error(`❌ Failed to mark email as read:`, error.message)
      throw error
    }
  }

  async addLabel(messageId, labelId) {
    try {
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      })
      logger.info(`✅ Added label ${labelId} to email ${messageId}`)
    } catch (error) {
      logger.error(`❌ Failed to add label:`, error.message)
      throw error
    }
  }

  async getLabels() {
    try {
      const response = await this.gmail.users.labels.list({
        userId: "me",
      })
      return response.data.labels || []
    } catch (error) {
      logger.error("❌ Failed to get labels:", error.message)
      throw error
    }
  }
}

export default new GmailService()
