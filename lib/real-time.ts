export interface RealTimeNotification {
  id: string
  type: "new_email" | "urgent_email" | "ai_insight" | "system" | "collaboration"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  priority: "low" | "medium" | "high"
  metadata?: Record<string, any>
}

export interface ActivityEvent {
  id: string
  type: "email_received" | "email_sent" | "email_processed" | "user_action" | "ai_analysis"
  description: string
  timestamp: Date
  user?: string
  emailId?: string
  metadata?: Record<string, any>
}

export interface LiveMetric {
  id: string
  name: string
  value: number
  previousValue: number
  trend: "up" | "down" | "stable"
  timestamp: Date
}

export interface CollaborationEvent {
  id: string
  type: "user_typing" | "user_viewing" | "user_editing" | "user_online" | "user_offline"
  userId: string
  userName: string
  emailId?: string
  timestamp: Date
}

// Mock real-time service
export class RealTimeService {
  private notifications: RealTimeNotification[] = []
  private activities: ActivityEvent[] = []
  private metrics: LiveMetric[] = []
  private collaborationEvents: CollaborationEvent[] = []
  private subscribers: Map<string, Function[]> = new Map()
  private intervals: NodeJS.Timeout[] = []

  constructor() {
    this.startMockRealTimeUpdates()
  }

  // Subscription management
  subscribe(event: string, callback: Function): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, [])
    }
    this.subscribers.get(event)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.subscribers.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  // Notifications
  addNotification(notification: Omit<RealTimeNotification, "id" | "timestamp" | "read">) {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    this.notifications.unshift(newNotification)
    this.emit("notification", newNotification)

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }
  }

  getNotifications(): RealTimeNotification[] {
    return this.notifications
  }

  markNotificationRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.emit("notification_read", notification)
    }
  }

  // Activities
  addActivity(activity: Omit<ActivityEvent, "id" | "timestamp">) {
    const newActivity: ActivityEvent = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    this.activities.unshift(newActivity)
    this.emit("activity", newActivity)

    // Keep only last 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100)
    }
  }

  getActivities(): ActivityEvent[] {
    return this.activities
  }

  // Metrics
  updateMetric(name: string, value: number) {
    const existingMetric = this.metrics.find((m) => m.name === name)
    const previousValue = existingMetric?.value || 0

    let trend: "up" | "down" | "stable" = "stable"
    if (value > previousValue) trend = "up"
    else if (value < previousValue) trend = "down"

    const metric: LiveMetric = {
      id: `metric-${name}`,
      name,
      value,
      previousValue,
      trend,
      timestamp: new Date(),
    }

    const index = this.metrics.findIndex((m) => m.name === name)
    if (index >= 0) {
      this.metrics[index] = metric
    } else {
      this.metrics.push(metric)
    }

    this.emit("metric_update", metric)
  }

  getMetrics(): LiveMetric[] {
    return this.metrics
  }

  // Collaboration
  addCollaborationEvent(event: Omit<CollaborationEvent, "id" | "timestamp">) {
    const newEvent: CollaborationEvent = {
      ...event,
      id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    this.collaborationEvents.unshift(newEvent)
    this.emit("collaboration", newEvent)

    // Keep only last 20 collaboration events
    if (this.collaborationEvents.length > 20) {
      this.collaborationEvents = this.collaborationEvents.slice(0, 20)
    }
  }

  getCollaborationEvents(): CollaborationEvent[] {
    return this.collaborationEvents
  }

  // Mock real-time updates
  private startMockRealTimeUpdates() {
    // Simulate new emails every 30-60 seconds
    const emailInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        this.addNotification({
          type: "new_email",
          title: "New Email Received",
          message: `From ${this.getRandomSender()}: ${this.getRandomSubject()}`,
          priority: Math.random() > 0.8 ? "high" : "medium",
        })

        this.addActivity({
          type: "email_received",
          description: `New email from ${this.getRandomSender()}`,
          user: "System",
        })
      }
    }, 45000)

    // Simulate urgent emails occasionally
    const urgentInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        this.addNotification({
          type: "urgent_email",
          title: "Urgent Email Alert",
          message: "High priority email requires immediate attention",
          priority: "high",
        })
      }
    }, 120000)

    // Simulate AI insights
    const aiInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        this.addNotification({
          type: "ai_insight",
          title: "AI Insight Available",
          message: this.getRandomInsight(),
          priority: "medium",
        })
      }
    }, 90000)

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      this.updateMetric("unread_count", Math.floor(Math.random() * 30) + 10)
      this.updateMetric("response_time", Math.random() * 2 + 1)
      this.updateMetric("sentiment_score", Math.random() * 100)
      this.updateMetric("ai_accuracy", 95 + Math.random() * 5)
    }, 15000)

    // Simulate collaboration events
    const collabInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        this.addCollaborationEvent({
          type: Math.random() > 0.5 ? "user_viewing" : "user_editing",
          userId: `user-${Math.floor(Math.random() * 4) + 1}`,
          userName: this.getRandomUser(),
          emailId: `email-${Math.floor(Math.random() * 10) + 1}`,
        })
      }
    }, 60000)

    this.intervals = [emailInterval, urgentInterval, aiInterval, metricsInterval, collabInterval]
  }

  private getRandomSender(): string {
    const senders = ["Sarah Johnson", "Mike Chen", "Alex Rodriguez", "Jennifer Walsh", "David Kim", "Lisa Park"]
    return senders[Math.floor(Math.random() * senders.length)]
  }

  private getRandomSubject(): string {
    const subjects = [
      "Payment Processing Issue",
      "API Integration Question",
      "Feature Request",
      "Bug Report",
      "Account Upgrade",
      "Technical Support Needed",
    ]
    return subjects[Math.floor(Math.random() * subjects.length)]
  }

  private getRandomInsight(): string {
    const insights = [
      "Response time spike detected in billing category",
      "Positive sentiment trend increasing by 15%",
      "New auto-categorization pattern identified",
      "Peak email volume approaching - consider scaling",
      "Customer satisfaction score improved this week",
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }

  private getRandomUser(): string {
    const users = ["Sarah J.", "Mike C.", "Alex R.", "Jennifer W."]
    return users[Math.floor(Math.random() * users.length)]
  }

  // Cleanup
  destroy() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.subscribers.clear()
  }
}

// Global instance
export const realTimeService = new RealTimeService()
