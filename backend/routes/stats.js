import express from "express"
import Email from "../models/Email.js"
import { AIInsights } from "../utils/aiInsights.js"
import aiService from "../services/aiService.js"
import gmailService from "../services/gmailService.js"
import { logger } from "../utils/logger.js"

const router = express.Router()

// GET /api/stats - Comprehensive analytics dashboard
router.get("/", async (req, res) => {
  try {
    logger.info("📊 Generating comprehensive analytics")

    const [basicStats, sentimentDistribution, priorityDistribution, categoryStats, timeSeriesData, aiInsights] =
      await Promise.all([
        getBasicStats(),
        getSentimentDistribution(),
        getPriorityDistribution(),
        getCategoryStats(),
        getTimeSeriesData(),
        AIInsights.generateDashboardInsights(),
      ])

    const stats = {
      overview: basicStats,
      distributions: {
        sentiment: sentimentDistribution,
        priority: priorityDistribution,
        categories: categoryStats,
      },
      trends: timeSeriesData,
      insights: aiInsights,
      services: {
        ai: aiService.getServiceStatus(),
        gmail: {
          isAuthenticated: gmailService.isAuthenticated,
          hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN,
        },
      },
      generatedAt: new Date().toISOString(),
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error("❌ Failed to generate stats:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to generate statistics",
      message: error.message,
    })
  }
})

// GET /api/stats/overview - Basic statistics overview
router.get("/overview", async (req, res) => {
  try {
    const stats = await getBasicStats()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error("❌ Failed to get overview stats:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get overview statistics",
      message: error.message,
    })
  }
})

// GET /api/stats/sentiment - Sentiment analysis statistics
router.get("/sentiment", async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query

    const sentimentStats = await getSentimentStats(timeRange)

    res.json({
      success: true,
      data: sentimentStats,
    })
  } catch (error) {
    logger.error("❌ Failed to get sentiment stats:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get sentiment statistics",
      message: error.message,
    })
  }
})

// GET /api/stats/priority - Priority distribution statistics
router.get("/priority", async (req, res) => {
  try {
    const priorityStats = await getPriorityStats()

    res.json({
      success: true,
      data: priorityStats,
    })
  } catch (error) {
    logger.error("❌ Failed to get priority stats:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get priority statistics",
      message: error.message,
    })
  }
})

// GET /api/stats/performance - Performance and response time statistics
router.get("/performance", async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query

    const performanceStats = await getPerformanceStats(timeRange)

    res.json({
      success: true,
      data: performanceStats,
    })
  } catch (error) {
    logger.error("❌ Failed to get performance stats:", error.message)
    res.status(500).json({
      success: false,
      error: "Failed to get performance statistics",
      message: error.message,
    })
  }
})

// Helper functions
async function getBasicStats() {
  const stats = await Email.aggregate([
    {
      $group: {
        _id: null,
        totalEmails: { $sum: 1 },
        pendingEmails: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        inProgressEmails: {
          $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
        },
        resolvedEmails: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        archivedEmails: {
          $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
        },
        urgentEmails: {
          $sum: { $cond: [{ $eq: ["$priority.level", "urgent"] }, 1, 0] },
        },
        unreadEmails: {
          $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ["$processedAt", null] }, { $ne: ["$dateReceived", null] }] },
              { $subtract: ["$processedAt", "$dateReceived"] },
              null,
            ],
          },
        },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ])

  const result = stats[0] || {
    totalEmails: 0,
    pendingEmails: 0,
    inProgressEmails: 0,
    resolvedEmails: 0,
    archivedEmails: 0,
    urgentEmails: 0,
    unreadEmails: 0,
    avgResponseTime: 0,
    avgProcessingTime: 0,
  }

  // Convert response time from milliseconds to hours
  if (result.avgResponseTime) {
    result.avgResponseTimeHours = result.avgResponseTime / (1000 * 60 * 60)
  }

  // Calculate resolution rate
  if (result.totalEmails > 0) {
    result.resolutionRate = (result.resolvedEmails / result.totalEmails) * 100
  } else {
    result.resolutionRate = 0
  }

  return result
}

async function getSentimentDistribution() {
  return await Email.aggregate([
    {
      $group: {
        _id: "$sentiment.label",
        count: { $sum: 1 },
        avgScore: { $avg: "$sentiment.score" },
        avgConfidence: { $avg: "$sentiment.confidence" },
      },
    },
    { $sort: { count: -1 } },
  ])
}

async function getPriorityDistribution() {
  return await Email.aggregate([
    {
      $group: {
        _id: "$priority.level",
        count: { $sum: 1 },
        avgScore: { $avg: "$priority.score" },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        resolutionRate: {
          $cond: [{ $gt: ["$count", 0] }, { $divide: ["$resolvedCount", "$count"] }, 0],
        },
      },
    },
    { $sort: { avgScore: -1 } },
  ])
}

async function getCategoryStats() {
  return await Email.aggregate([
    {
      $group: {
        _id: "$category.id",
        categoryName: { $first: "$category.name" },
        count: { $sum: 1 },
        avgConfidence: { $avg: "$category.confidence" },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ["$processedAt", null] }, { $ne: ["$dateReceived", null] }] },
              { $subtract: ["$processedAt", "$dateReceived"] },
              null,
            ],
          },
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        resolutionRate: {
          $cond: [{ $gt: ["$count", 0] }, { $divide: ["$resolvedCount", "$count"] }, 0],
        },
        avgResponseTimeHours: {
          $cond: [{ $ne: ["$avgResponseTime", null] }, { $divide: ["$avgResponseTime", 3600000] }, null],
        },
      },
    },
    { $sort: { count: -1 } },
  ])
}

async function getTimeSeriesData() {
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  return await Email.aggregate([
    { $match: { dateReceived: { $gte: last30Days } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$dateReceived" } },
        },
        totalEmails: { $sum: 1 },
        resolvedEmails: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        urgentEmails: {
          $sum: { $cond: [{ $eq: ["$priority.level", "urgent"] }, 1, 0] },
        },
        avgSentimentScore: { $avg: "$sentiment.score" },
        avgPriorityScore: { $avg: "$priority.score" },
      },
    },
    { $sort: { "_id.date": 1 } },
  ])
}

async function getSentimentStats(timeRange) {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return await Email.aggregate([
    { $match: { dateReceived: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$dateReceived" } },
          sentiment: "$sentiment.label",
        },
        count: { $sum: 1 },
        avgScore: { $avg: "$sentiment.score" },
        avgConfidence: { $avg: "$sentiment.confidence" },
      },
    },
    { $sort: { "_id.date": 1, "_id.sentiment": 1 } },
  ])
}

async function getPriorityStats() {
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  return await Email.aggregate([
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: "$priority.level",
              count: { $sum: 1 },
              avgScore: { $avg: "$priority.score" },
            },
          },
        ],
        recent: [
          { $match: { dateReceived: { $gte: last7Days } } },
          {
            $group: {
              _id: "$priority.level",
              count: { $sum: 1 },
              avgScore: { $avg: "$priority.score" },
            },
          },
        ],
      },
    },
  ])
}

async function getPerformanceStats(timeRange) {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return await Email.aggregate([
    {
      $match: {
        dateReceived: { $gte: startDate },
        processedAt: { $ne: null },
      },
    },
    {
      $addFields: {
        responseTimeHours: {
          $divide: [{ $subtract: ["$processedAt", "$dateReceived"] }, 3600000],
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$dateReceived" } },
        },
        avgResponseTime: { $avg: "$responseTimeHours" },
        minResponseTime: { $min: "$responseTimeHours" },
        maxResponseTime: { $max: "$responseTimeHours" },
        processedCount: { $sum: 1 },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
    { $sort: { "_id.date": 1 } },
  ])
}

export default router
