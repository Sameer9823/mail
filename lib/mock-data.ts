import type { Email, EmailCategory, EmailStats, DraftResponse } from "./types"

export const emailCategories: EmailCategory[] = [
  {
    id: "support",
    name: "Customer Support",
    color: "bg-blue-500",
    description: "Customer inquiries and support requests",
    autoAssigned: true,
  },
  {
    id: "sales",
    name: "Sales Inquiry",
    color: "bg-green-500",
    description: "Sales leads and product inquiries",
    autoAssigned: true,
  },
  {
    id: "billing",
    name: "Billing",
    color: "bg-yellow-500",
    description: "Payment and billing related emails",
    autoAssigned: true,
  },
  {
    id: "technical",
    name: "Technical",
    color: "bg-purple-500",
    description: "Technical issues and bug reports",
    autoAssigned: true,
  },
  {
    id: "feedback",
    name: "Feedback",
    color: "bg-pink-500",
    description: "User feedback and suggestions",
    autoAssigned: true,
  },
  {
    id: "spam",
    name: "Spam",
    color: "bg-red-500",
    description: "Spam and promotional emails",
    autoAssigned: true,
  },
]

export const mockEmails: Email[] = [
  {
    id: "1",
    subject: "Urgent: Payment Processing Issue",
    sender: {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      avatar: "/professional-woman-avatar.png",
    },
    recipient: "support@yourcompany.com",
    content:
      "Hi, I'm having trouble processing my payment for the premium plan. The transaction keeps failing and I need this resolved ASAP as my team is waiting. Can someone please help me immediately?",
    timestamp: new Date("2024-01-15T10:30:00"),
    isRead: false,
    category: emailCategories[2], // billing
    priority: {
      level: "urgent",
      score: 9,
      factors: ["Payment issue", "Business impact", "Urgent language"],
    },
    sentiment: {
      score: -0.6,
      confidence: 0.85,
      emotions: {
        anger: 0.3,
        joy: 0.0,
        fear: 0.4,
        sadness: 0.2,
        surprise: 0.1,
      },
      urgency: "high",
    },
    tags: ["payment", "urgent", "premium-plan"],
    threadId: "thread-1",
  },
  {
    id: "2",
    subject: "Love the new features!",
    sender: {
      name: "Mike Chen",
      email: "mike.chen@startup.io",
      avatar: "/asian-man-smiling-avatar.jpg",
    },
    recipient: "feedback@yourcompany.com",
    content:
      "Just wanted to say how much I love the new dashboard updates! The AI features are incredible and have saved our team so much time. Keep up the amazing work!",
    timestamp: new Date("2024-01-15T09:15:00"),
    isRead: true,
    category: emailCategories[4], // feedback
    priority: {
      level: "low",
      score: 3,
      factors: ["Positive feedback", "No action required"],
    },
    sentiment: {
      score: 0.9,
      confidence: 0.95,
      emotions: {
        anger: 0.0,
        joy: 0.8,
        fear: 0.0,
        sadness: 0.0,
        surprise: 0.2,
      },
      urgency: "low",
    },
    tags: ["feedback", "positive", "dashboard"],
    threadId: "thread-2",
  },
  {
    id: "3",
    subject: "API Integration Question",
    sender: {
      name: "Alex Rodriguez",
      email: "alex@techcorp.com",
      avatar: "/developer-man-avatar.jpg",
    },
    recipient: "support@yourcompany.com",
    content:
      "Hi team, I'm trying to integrate your API with our system but I'm getting a 401 error when making requests. I've double-checked my API key. Could you help me troubleshoot this?",
    timestamp: new Date("2024-01-15T08:45:00"),
    isRead: false,
    category: emailCategories[3], // technical
    priority: {
      level: "medium",
      score: 6,
      factors: ["Technical issue", "API integration", "Developer inquiry"],
    },
    sentiment: {
      score: -0.2,
      confidence: 0.7,
      emotions: {
        anger: 0.1,
        joy: 0.0,
        fear: 0.2,
        sadness: 0.1,
        surprise: 0.0,
      },
      urgency: "medium",
    },
    tags: ["api", "technical", "401-error"],
    threadId: "thread-3",
  },
  {
    id: "4",
    subject: "Interested in Enterprise Plan",
    sender: {
      name: "Jennifer Walsh",
      email: "j.walsh@enterprise.com",
      avatar: "/business-woman-avatar.png",
    },
    recipient: "sales@yourcompany.com",
    content:
      "Hello, I represent a Fortune 500 company and we're interested in your Enterprise plan for our 500+ employee organization. Could we schedule a demo call this week?",
    timestamp: new Date("2024-01-15T07:20:00"),
    isRead: false,
    category: emailCategories[1], // sales
    priority: {
      level: "high",
      score: 8,
      factors: ["Enterprise inquiry", "Large organization", "Demo request"],
    },
    sentiment: {
      score: 0.4,
      confidence: 0.8,
      emotions: {
        anger: 0.0,
        joy: 0.3,
        fear: 0.0,
        sadness: 0.0,
        surprise: 0.0,
      },
      urgency: "medium",
    },
    tags: ["enterprise", "sales", "demo", "fortune-500"],
    threadId: "thread-4",
  },
]

export const mockStats: EmailStats = {
  totalEmails: 1247,
  unreadCount: 23,
  todayCount: 47,
  avgResponseTime: 2.4, // hours
  sentimentDistribution: {
    positive: 45,
    neutral: 35,
    negative: 20,
  },
  categoryDistribution: {
    "Customer Support": 35,
    "Sales Inquiry": 25,
    Technical: 20,
    Billing: 10,
    Feedback: 8,
    Spam: 2,
  },
  priorityDistribution: {
    urgent: 5,
    high: 15,
    medium: 45,
    low: 35,
  },
}

export const mockDraftResponses: DraftResponse[] = [
  {
    id: "draft-1",
    emailId: "1",
    content:
      "Hi Sarah,\n\nThank you for reaching out about the payment processing issue. I understand how urgent this is for your team.\n\nI've immediately escalated this to our billing team and they're investigating the issue. In the meantime, I've temporarily extended your premium access.\n\nYou should receive an update within the next 30 minutes. If you need immediate assistance, please call our priority support line at (555) 123-4567.\n\nBest regards,\nSupport Team",
    tone: "professional",
    confidence: 0.92,
    suggestions: [
      "Consider offering a direct phone number for urgent issues",
      "Mention specific timeline for resolution",
      "Provide alternative payment methods",
    ],
    createdAt: new Date("2024-01-15T10:35:00"),
    isEdited: false,
  },
  {
    id: "draft-3",
    emailId: "3",
    content:
      "Hi Alex,\n\nThanks for reaching out about the API integration issue. A 401 error typically indicates an authentication problem.\n\nHere are a few things to check:\n1. Ensure your API key is correctly formatted in the Authorization header\n2. Verify that your API key hasn't expired\n3. Check that you're using the correct endpoint URL\n\nI've also sent you a detailed integration guide to your email. If you're still experiencing issues after trying these steps, please share your request headers (without the actual API key) and I'll help you troubleshoot further.\n\nBest regards,\nTechnical Support",
    tone: "professional",
    confidence: 0.88,
    suggestions: [
      "Include link to API documentation",
      "Offer to schedule a screen-sharing session",
      "Provide example code snippets",
    ],
    createdAt: new Date("2024-01-15T08:50:00"),
    isEdited: false,
  },
]
