import cron from "node-cron"
import Email from "../models/Email.js"
import smtpService from "./smtpService.js"
import emailTemplates from "./emailTemplates.js"
import priorityQueue from "./priorityQueue.js"
import { logger } from "../utils/logger.js"

class EmailScheduler {
  constructor() {
    this.scheduledJobs = new Map()
    this.isInitialized = false
    this.initialize()
  }

  initialize() {
    try {
      // Schedule automatic email processing every 5 minutes
      this.scheduleEmailProcessing()

      // Schedule follow-up emails daily at 9 AM
      this.scheduleFollowUpEmails()

      // Schedule urgent email alerts every 15 minutes
      this.scheduleUrgentEmailAlerts()

      // Schedule cleanup tasks daily at midnight
      this.scheduleCleanupTasks()

      this.isInitialized = true
      logger.info("✅ Email Scheduler initialized successfully")
    } catch (error) {
      logger.error("❌ Failed to initialize Email Scheduler:", error.message)
    }
  }

  scheduleEmailProcessing() {
    const job = cron.schedule(
      "*/5 * * * *",
      async () => {
        try {
          logger.info("🔄 Running scheduled email processing...")
          await priorityQueue.processUrgentEmails()
        } catch (error) {
          logger.error("❌ Scheduled email processing failed:", error.message)
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    )

    this.scheduledJobs.set("emailProcessing", job)
    logger.info("📅 Scheduled email processing every 5 minutes")
  }

  scheduleFollowUpEmails() {
    const job = cron.schedule(
      "0 9 * * *",
      async () => {
        try {
          logger.info("📧 Running scheduled follow-up emails...")
          await this.sendFollowUpEmails()
        } catch (error) {
          logger.error("❌ Scheduled follow-up emails failed:", error.message)
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    )

    this.scheduledJobs.set("followUpEmails", job)
    logger.info("📅 Scheduled follow-up emails daily at 9 AM UTC")
  }

  scheduleUrgentEmailAlerts() {
    const job = cron.schedule(
      "*/15 * * * *",
      async () => {
        try {
          await this.checkUrgentEmailAlerts()
        } catch (error) {
          logger.error("❌ Urgent email alerts check failed:", error.message)
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    )

    this.scheduledJobs.set("urgentAlerts", job)
    logger.info("📅 Scheduled urgent email alerts every 15 minutes")
  }

  scheduleCleanupTasks() {
    const job = cron.schedule(
      "0 0 * * *",
      async () => {
        try {
          logger.info("🧹 Running scheduled cleanup tasks...")
          await this.runCleanupTasks()
        } catch (error) {
          logger.error("❌ Scheduled cleanup tasks failed:", error.message)
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    )

    this.scheduledJobs.set("cleanup", job)
    logger.info("📅 Scheduled cleanup tasks daily at midnight UTC")
  }

  async sendFollowUpEmails() {
    try {
      // Find resolved emails from 3 days ago that haven't received follow-up
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const emailsForFollowUp = await Email.find({
        status: "resolved",
        processedAt: {
          $gte: threeDaysAgo,
          $lt: twoDaysAgo,
        },
        followUpSent: { $ne: true },
      }).limit(50)

      logger.info(`📧 Found ${emailsForFollowUp.length} emails for follow-up`)

      for (const email of emailsForFollowUp) {
        try {
          const templateData = {
            customerName: email.sender.name,
            ticketId: email._id.toString().slice(-8).toUpperCase(),
            subject: email.subject,
            daysSinceResolution: Math.floor((Date.now() - email.processedAt) / (1000 * 60 * 60 * 24)),
            feedbackUrl: `${process.env.FRONTEND_URL}/feedback/${email._id}`,
            supportEmail: process.env.SMTP_USER,
          }

          const emailContent = emailTemplates.generateEmail("followUp", templateData)

          await smtpService.sendEmail({
            to: email.sender.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          })

          // Mark as follow-up sent
          email.followUpSent = true
          await email.save()

          logger.info(`✅ Follow-up email sent to ${email.sender.email}`)
        } catch (error) {
          logger.error(`❌ Failed to send follow-up email to ${email.sender.email}:`, error.message)
        }
      }
    } catch (error) {
      logger.error("❌ Follow-up email process failed:", error.message)
    }
  }

  async checkUrgentEmailAlerts() {
    try {
      // Find urgent emails older than 1 hour that are still pending
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const overdueUrgentEmails = await Email.find({
        "priority.level": "urgent",
        status: "pending",
        dateReceived: { $lt: oneHourAgo },
        escalationSent: { $ne: true },
      })

      if (overdueUrgentEmails.length > 0) {
        logger.warn(`🚨 Found ${overdueUrgentEmails.length} overdue urgent emails`)

        // Send escalation notifications
        for (const email of overdueUrgentEmails) {
          await this.sendEscalationNotification(email)
        }
      }
    } catch (error) {
      logger.error("❌ Urgent email alerts check failed:", error.message)
    }
  }

  async sendEscalationNotification(email) {
    try {
      const templateData = {
        customerName: email.sender.name,
        ticketId: email._id.toString().slice(-8).toUpperCase(),
        subject: email.subject,
        escalationContact: process.env.ESCALATION_EMAIL || process.env.SMTP_USER,
        directContactUrl: `${process.env.FRONTEND_URL}/contact/urgent`,
        supportEmail: process.env.SMTP_USER,
      }

      const emailContent = emailTemplates.generateEmail("escalation", templateData)

      // Send to customer
      await smtpService.sendEmail({
        to: email.sender.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: "high",
      })

      // Send internal alert
      if (process.env.ESCALATION_EMAIL) {
        await smtpService.sendEmail({
          to: process.env.ESCALATION_EMAIL,
          subject: `URGENT: Overdue ticket #${templateData.ticketId}`,
          html: `
            <h2>Urgent Ticket Escalation</h2>
            <p><strong>Ticket:</strong> #${templateData.ticketId}</p>
            <p><strong>Customer:</strong> ${email.sender.name} (${email.sender.email})</p>
            <p><strong>Subject:</strong> ${email.subject}</p>
            <p><strong>Received:</strong> ${email.dateReceived}</p>
            <p><strong>Priority:</strong> ${email.priority.level} (Score: ${email.priority.score})</p>
            <p><strong>Category:</strong> ${email.category.name}</p>
            <p>This urgent ticket has been pending for over 1 hour and requires immediate attention.</p>
          `,
          priority: "high",
        })
      }

      // Mark escalation as sent
      email.escalationSent = true
      await email.save()

      logger.info(`🚨 Escalation notification sent for ticket ${templateData.ticketId}`)
    } catch (error) {
      logger.error("❌ Failed to send escalation notification:", error.message)
    }
  }

  async runCleanupTasks() {
    try {
      const tasks = [this.cleanupOldLogs(), this.archiveOldEmails(), this.updateEmailStatistics()]

      await Promise.all(tasks)
      logger.info("✅ Cleanup tasks completed successfully")
    } catch (error) {
      logger.error("❌ Cleanup tasks failed:", error.message)
    }
  }

  async cleanupOldLogs() {
    // This would typically clean up log files older than a certain period
    logger.info("🧹 Cleaning up old logs...")
    // Implementation depends on your logging setup
  }

  async archiveOldEmails() {
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const result = await Email.updateMany(
        {
          dateReceived: { $lt: sixMonthsAgo },
          status: "resolved",
        },
        {
          $set: { status: "archived" },
        },
      )

      logger.info(`📦 Archived ${result.modifiedCount} old resolved emails`)
    } catch (error) {
      logger.error("❌ Failed to archive old emails:", error.message)
    }
  }

  async updateEmailStatistics() {
    try {
      // Update any cached statistics or metrics
      logger.info("📊 Updating email statistics...")
      // Implementation would update any cached metrics
    } catch (error) {
      logger.error("❌ Failed to update email statistics:", error.message)
    }
  }

  scheduleCustomEmail(cronExpression, emailData, templateType = "acknowledgment") {
    try {
      const jobId = `custom_${Date.now()}`

      const job = cron.schedule(
        cronExpression,
        async () => {
          try {
            const emailContent = emailTemplates.generateEmail(templateType, emailData)

            await smtpService.sendEmail({
              to: emailData.to,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            })

            logger.info(`✅ Custom scheduled email sent: ${jobId}`)

            // Remove one-time job
            this.cancelScheduledJob(jobId)
          } catch (error) {
            logger.error(`❌ Custom scheduled email failed: ${jobId}`, error.message)
          }
        },
        {
          scheduled: true,
          timezone: "UTC",
        },
      )

      this.scheduledJobs.set(jobId, job)
      logger.info(`📅 Custom email scheduled: ${jobId}`)

      return jobId
    } catch (error) {
      logger.error("❌ Failed to schedule custom email:", error.message)
      throw error
    }
  }

  cancelScheduledJob(jobId) {
    const job = this.scheduledJobs.get(jobId)
    if (job) {
      job.stop()
      this.scheduledJobs.delete(jobId)
      logger.info(`🛑 Cancelled scheduled job: ${jobId}`)
      return true
    }
    return false
  }

  getScheduledJobs() {
    return Array.from(this.scheduledJobs.keys()).map((jobId) => ({
      id: jobId,
      running: this.scheduledJobs.get(jobId).running,
    }))
  }

  stopAllJobs() {
    for (const [jobId, job] of this.scheduledJobs) {
      job.stop()
      logger.info(`🛑 Stopped job: ${jobId}`)
    }
    logger.info("🛑 All scheduled jobs stopped")
  }
}

export default new EmailScheduler()
