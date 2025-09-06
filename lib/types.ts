export interface Email {
  id: string
  subject: string
  sender: {
    name: string
    email: string
    avatar?: string
  }
  recipient: string
  content: string
  timestamp: Date
  isRead: boolean
  category: EmailCategory
  priority: Priority
  sentiment: SentimentAnalysis
  tags: string[]
  attachments?: Attachment[]
  threadId?: string
}

export interface SentimentAnalysis {
  score: number // -1 to 1 (-1 = very negative, 0 = neutral, 1 = very positive)
  confidence: number // 0 to 1
  emotions: {
    anger: number
    joy: number
    fear: number
    sadness: number
    surprise: number
  }
  urgency: "low" | "medium" | "high"
}

export interface EmailCategory {
  id: string
  name: string
  color: string
  description: string
  autoAssigned: boolean
}

export interface Priority {
  level: "low" | "medium" | "high" | "urgent"
  score: number // 1-10
  factors: string[] // reasons for priority assignment
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface DraftResponse {
  id: string
  emailId: string
  content: string
  tone: "professional" | "friendly" | "formal" | "casual"
  confidence: number
  suggestions: string[]
  createdAt: Date
  isEdited: boolean
}

export interface EmailStats {
  totalEmails: number
  unreadCount: number
  todayCount: number
  avgResponseTime: number
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  categoryDistribution: Record<string, number>
  priorityDistribution: Record<string, number>
}
