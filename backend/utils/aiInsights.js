import Email from "../models/Email.js"
import { logger } from "./logger.js"

export class AIInsights {
  static async generateDashboardInsights() {
    try {
      const [totalStats, sentimentTrends, priorityDistribution, categoryPerformance, responseTimeAnalysis] =
        await Promise.all([
          this.getTotalStats(),
          this.getSentimentTrends(),
          this.getPriorityDistribution(),
          this.getCategoryPerformance(),
          this.getResponseTimeAnalysis(),
        ])

      const insights = {
        summary: this.generateSummaryInsights(totalStats, sentimentTrends),
        recommendations: this.generateRecommendations(priorityDistribution, responseTimeAnalysis),
        alerts: this.generateAlerts(totalStats, priorityDistribution),
        trends: {
          sentiment: sentimentTrends,
          priority: priorityDistribution,
          categories: categoryPerformance,
          responseTime: responseTimeAnalysis,
        },
      }

      return insights
    } catch (error) {
      logger.error("❌ Failed to generate AI insights:", error.message)
      throw error
    }
  }

  static async getTotalStats() {
    const stats = await Email.aggregate([
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          pendingEmails: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          resolvedEmails: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          urgentEmails: {
            $sum: { $cond: [{ $eq: ["$priority.level", "urgent"] }, 1, 0] },
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
        },
      },
    ])

    return (
      stats[0] || {
        totalEmails: 0,
        pendingEmails: 0,
        resolvedEmails: 0,
        urgentEmails: 0,
        avgResponseTime: 0,
      }
    )
  }

  static async getSentimentTrends() {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    return await Email.aggregate([
      { $match: { dateReceived: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$dateReceived" } },
            sentiment: "$sentiment.label",
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$sentiment.score" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])
  }

  static async getPriorityDistribution() {
    return await Email.aggregate([
      {
        $group: {
          _id: "$priority.level",
          count: { $sum: 1 },
          avgScore: { $avg: "$priority.score" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ])
  }

  static async getCategoryPerformance() {
    return await Email.aggregate([
      {
        $group: {
          _id: "$category.id",
          categoryName: { $first: "$category.name" },
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: [{ $ne: ["$processedAt", null] }, { $subtract: ["$processedAt", "$dateReceived"] }, null],
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
        },
      },
    ])
  }

  static async getResponseTimeAnalysis() {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    return await Email.aggregate([
      {
        $match: {
          dateReceived: { $gte: last30Days },
          processedAt: { $ne: null },
        },
      },
      {
        $addFields: {
          responseTimeHours: {
            $divide: [
              { $subtract: ["$processedAt", "$dateReceived"] },
              3600000, // Convert to hours
            ],
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
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])
  }

  static generateSummaryInsights(stats, sentimentTrends) {
    const insights = []

    // Volume insights
    if (stats.totalEmails > 0) {
      const pendingPercentage = (stats.pendingEmails / stats.totalEmails) * 100
      if (pendingPercentage > 70) {
        insights.push({
          type: "warning",
          title: "High Pending Volume",
          message: `${pendingPercentage.toFixed(1)}% of emails are still pending. Consider increasing processing capacity.`,
        })
      }
    }

    // Urgent emails insight
    if (stats.urgentEmails > 0) {
      insights.push({
        type: "alert",
        title: "Urgent Emails Detected",
        message: `${stats.urgentEmails} urgent emails require immediate attention.`,
      })
    }

    // Sentiment insights
    const recentNegative = sentimentTrends.filter((t) => t._id.sentiment === "negative" && t.count > 0).length

    if (recentNegative > 3) {
      insights.push({
        type: "warning",
        title: "Negative Sentiment Trend",
        message: "Increased negative sentiment detected in recent emails. Review customer satisfaction.",
      })
    }

    return insights
  }

  static generateRecommendations(priorityDist, responseTimeAnalysis) {
    const recommendations = []

    // Priority-based recommendations
    const urgentPending = priorityDist.find((p) => p._id === "urgent")?.pendingCount || 0
    if (urgentPending > 0) {
      recommendations.push({
        priority: "high",
        title: "Address Urgent Emails",
        action: `Process ${urgentPending} urgent emails immediately`,
        impact: "Prevents customer escalation and maintains SLA compliance",
      })
    }

    // Response time recommendations
    const avgResponseTime =
      responseTimeAnalysis.reduce((acc, day) => acc + (day.avgResponseTime || 0), 0) / responseTimeAnalysis.length

    if (avgResponseTime > 24) {
      recommendations.push({
        priority: "medium",
        title: "Improve Response Time",
        action: "Current average response time exceeds 24 hours",
        impact: "Faster responses improve customer satisfaction and retention",
      })
    }

    return recommendations
  }

  static generateAlerts(stats, priorityDist) {
    const alerts = []

    // Critical volume alert
    if (stats.pendingEmails > 100) {
      alerts.push({
        level: "critical",
        title: "High Pending Volume",
        message: `${stats.pendingEmails} emails pending processing`,
        timestamp: new Date(),
      })
    }

    // Urgent emails alert
    const urgentCount = priorityDist.find((p) => p._id === "urgent")?.count || 0
    if (urgentCount > 5) {
      alerts.push({
        level: "warning",
        title: "Multiple Urgent Emails",
        message: `${urgentCount} urgent emails detected`,
        timestamp: new Date(),
      })
    }

    return alerts
  }
}
