import nodemailer from "nodemailer"
import { logger } from "../utils/logger.js"

class SMTPService {
  constructor() {
    this.transporter = null
    this.isInitialized = false
    this.initialize()
  }

  initialize() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn("⚠️ SMTP credentials not found, SMTP service will be limited")
        return
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT) || 587,
        secure: Number.parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      this.isInitialized = true
      logger.info("✅ SMTP Service initialized successfully")
    } catch (error) {
      logger.error("❌ Failed to initialize SMTP Service:", error.message)
    }
  }

  async verifyConnection() {
    if (!this.isInitialized) {
      throw new Error("SMTP service not initialized")
    }

    try {
      await this.transporter.verify()
      logger.info("✅ SMTP connection verified")
      return true
    } catch (error) {
      logger.error("❌ SMTP connection verification failed:", error.message)
      throw error
    }
  }

  async sendEmail(emailOptions) {
    if (!this.isInitialized) {
      throw new Error("SMTP service not initialized")
    }

    try {
      const { to, cc, bcc, subject, text, html, attachments, replyTo, priority = "normal" } = emailOptions

      const mailOptions = {
        from: `"AI Communication Assistant" <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text,
        html,
        replyTo: replyTo || process.env.SMTP_USER,
        priority,
        headers: {
          "X-Mailer": "AI Communication Assistant v1.0",
          "X-Priority": priority === "high" ? "1" : priority === "low" ? "5" : "3",
        },
      }

      if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc
      if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc
      if (attachments) mailOptions.attachments = attachments

      const result = await this.transporter.sendMail(mailOptions)

      logger.info(`✅ Email sent via SMTP: ${result.messageId}`)
      return {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      }
    } catch (error) {
      logger.error("❌ Failed to send email via SMTP:", error.message)
      throw error
    }
  }

  async sendBulkEmails(emails) {
    if (!this.isInitialized) {
      throw new Error("SMTP service not initialized")
    }

    const results = []
    const errors = []

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email)
        results.push({ email: email.to, result, status: "sent" })

        // Add delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        errors.push({ email: email.to, error: error.message, status: "failed" })
        logger.error(`❌ Failed to send bulk email to ${email.to}:`, error.message)
      }
    }

    logger.info(`📧 Bulk email completed: ${results.length} sent, ${errors.length} failed`)
    return { results, errors }
  }

  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, "$1***$2") : null,
    }
  }
}

export default new SMTPService()
