import type { Email, SentimentAnalysis, Priority, EmailCategory, DraftResponse } from "./types"

export interface AIInsight {
  id: string
  type: "sentiment" | "priority" | "category" | "response_suggestion" | "trend"
  title: string
  description: string
  confidence: number
  actionable: boolean
  emailId?: string
  createdAt: Date
}

export interface AIProcessingResult {
  emailId: string
  sentiment: SentimentAnalysis
  priority: Priority
  category: EmailCategory
  suggestedTags: string[]
  insights: AIInsight[]
  processingTime: number
}

export interface ResponseTemplate {
  id: string
  name: string
  category: string
  tone: "professional" | "friendly" | "formal" | "casual"
  template: string
  variables: string[]
  useCase: string
}

// Mock AI models and processing
export class AIProcessor {
  private sentimentModel: SentimentModel
  private categoryModel: CategoryModel
  private priorityModel: PriorityModel
  private responseGenerator: ResponseGenerator

  constructor() {
    this.sentimentModel = new SentimentModel()
    this.categoryModel = new CategoryModel()
    this.priorityModel = new PriorityModel()
    this.responseGenerator = new ResponseGenerator()
  }

  async processEmail(email: Email): Promise<AIProcessingResult> {
    const startTime = Date.now()

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const sentiment = await this.sentimentModel.analyze(email.content)
    const category = await this.categoryModel.categorize(email.subject, email.content)
    const priority = await this.priorityModel.calculatePriority(email, sentiment)
    const suggestedTags = await this.extractTags(email.content, category)
    const insights = await this.generateInsights(email, sentiment, priority, category)

    return {
      emailId: email.id,
      sentiment,
      priority,
      category,
      suggestedTags,
      insights,
      processingTime: Date.now() - startTime,
    }
  }

  async generateResponse(email: Email, tone = "professional"): Promise<DraftResponse> {
    return this.responseGenerator.generateDraft(email, tone as any)
  }

  async batchProcess(emails: Email[]): Promise<AIProcessingResult[]> {
    const results: AIProcessingResult[] = []

    for (const email of emails) {
      const result = await this.processEmail(email)
      results.push(result)
    }

    return results
  }

  private async extractTags(content: string, category: EmailCategory): Promise<string[]> {
    const keywords = content.toLowerCase().split(/\s+/)
    const tags: string[] = []

    // Simulate intelligent tag extraction
    const tagPatterns = {
      urgent: ["urgent", "asap", "immediately", "emergency"],
      payment: ["payment", "billing", "invoice", "charge"],
      technical: ["bug", "error", "api", "integration", "code"],
      "feature-request": ["feature", "enhancement", "suggestion", "improve"],
      complaint: ["disappointed", "frustrated", "problem", "issue"],
      praise: ["love", "great", "amazing", "excellent", "fantastic"],
    }

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some((pattern) => keywords.includes(pattern))) {
        tags.push(tag)
      }
    }

    // Add category-specific tags
    tags.push(category.name.toLowerCase().replace(/\s+/g, "-"))

    return tags.slice(0, 5) // Limit to 5 tags
  }

  private async generateInsights(
    email: Email,
    sentiment: SentimentAnalysis,
    priority: Priority,
    category: EmailCategory,
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Sentiment-based insights
    if (sentiment.score < -0.5) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: "sentiment",
        title: "Negative Sentiment Detected",
        description:
          "This email contains strong negative emotions. Consider prioritizing a quick, empathetic response.",
        confidence: sentiment.confidence,
        actionable: true,
        emailId: email.id,
        createdAt: new Date(),
      })
    }

    // Priority-based insights
    if (priority.level === "urgent") {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: "priority",
        title: "Urgent Response Required",
        description: `High priority email detected. Factors: ${priority.factors.join(", ")}`,
        confidence: 0.9,
        actionable: true,
        emailId: email.id,
        createdAt: new Date(),
      })
    }

    // Response suggestions
    if (category.name === "Customer Support" && sentiment.score < 0) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: "response_suggestion",
        title: "Empathetic Response Recommended",
        description: "Customer appears frustrated. Use empathetic language and offer immediate assistance.",
        confidence: 0.85,
        actionable: true,
        emailId: email.id,
        createdAt: new Date(),
      })
    }

    return insights
  }
}

class SentimentModel {
  async analyze(content: string): Promise<SentimentAnalysis> {
    // Simulate advanced sentiment analysis
    const words = content.toLowerCase().split(/\s+/)

    const positiveWords = [
      "love",
      "great",
      "excellent",
      "amazing",
      "fantastic",
      "perfect",
      "wonderful",
      "happy",
      "pleased",
      "satisfied",
    ]
    const negativeWords = [
      "hate",
      "terrible",
      "awful",
      "horrible",
      "frustrated",
      "angry",
      "disappointed",
      "problem",
      "issue",
      "broken",
    ]
    const urgentWords = ["urgent", "asap", "immediately", "emergency", "critical", "important"]

    let positiveScore = 0
    let negativeScore = 0
    let urgencyScore = 0

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveScore++
      if (negativeWords.includes(word)) negativeScore++
      if (urgentWords.includes(word)) urgencyScore++
    })

    const totalWords = words.length
    const sentimentScore = (positiveScore - negativeScore) / Math.max(totalWords * 0.1, 1)
    const clampedScore = Math.max(-1, Math.min(1, sentimentScore))

    // Calculate emotions
    const emotions = {
      anger: negativeScore > 0 ? Math.min((negativeScore / totalWords) * 10, 1) : 0,
      joy: positiveScore > 0 ? Math.min((positiveScore / totalWords) * 10, 1) : 0,
      fear: urgencyScore > 0 ? Math.min((urgencyScore / totalWords) * 8, 1) : 0,
      sadness: negativeWords.filter((w) => ["disappointed", "sad"].includes(w)).length > 0 ? 0.3 : 0,
      surprise: words.includes("surprised") || words.includes("unexpected") ? 0.4 : 0,
    }

    const urgency = urgencyScore > 0 ? "high" : Math.abs(clampedScore) > 0.5 ? "medium" : "low"

    return {
      score: clampedScore,
      confidence: Math.min(0.95, 0.6 + Math.abs(clampedScore) * 0.4),
      emotions,
      urgency: urgency as "low" | "medium" | "high",
    }
  }
}

class CategoryModel {
  private categories = [
    { id: "support", keywords: ["help", "problem", "issue", "bug", "error", "support", "assistance"] },
    { id: "sales", keywords: ["buy", "purchase", "price", "cost", "demo", "trial", "enterprise", "plan"] },
    { id: "billing", keywords: ["payment", "billing", "invoice", "charge", "refund", "subscription"] },
    { id: "technical", keywords: ["api", "integration", "code", "developer", "technical", "documentation"] },
    { id: "feedback", keywords: ["feedback", "suggestion", "feature", "improvement", "love", "great"] },
    { id: "spam", keywords: ["promotion", "offer", "deal", "discount", "free", "win", "congratulations"] },
  ]

  async categorize(subject: string, content: string): Promise<EmailCategory> {
    const text = (subject + " " + content).toLowerCase()
    const scores: Record<string, number> = {}

    this.categories.forEach((category) => {
      scores[category.id] = category.keywords.reduce((score, keyword) => {
        const matches = (text.match(new RegExp(keyword, "g")) || []).length
        return score + matches
      }, 0)
    })

    const bestCategory = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0]

    // Fallback to support if no clear category
    const categoryId = scores[bestCategory] > 0 ? bestCategory : "support"

    const categoryMap = {
      support: {
        id: "support",
        name: "Customer Support",
        color: "bg-blue-500",
        description: "Customer inquiries and support requests",
        autoAssigned: true,
      },
      sales: {
        id: "sales",
        name: "Sales Inquiry",
        color: "bg-green-500",
        description: "Sales leads and product inquiries",
        autoAssigned: true,
      },
      billing: {
        id: "billing",
        name: "Billing",
        color: "bg-yellow-500",
        description: "Payment and billing related emails",
        autoAssigned: true,
      },
      technical: {
        id: "technical",
        name: "Technical",
        color: "bg-purple-500",
        description: "Technical issues and bug reports",
        autoAssigned: true,
      },
      feedback: {
        id: "feedback",
        name: "Feedback",
        color: "bg-pink-500",
        description: "User feedback and suggestions",
        autoAssigned: true,
      },
      spam: {
        id: "spam",
        name: "Spam",
        color: "bg-red-500",
        description: "Spam and promotional emails",
        autoAssigned: true,
      },
    }

    return categoryMap[categoryId as keyof typeof categoryMap]
  }
}

class PriorityModel {
  async calculatePriority(email: Email, sentiment: SentimentAnalysis): Promise<Priority> {
    let score = 5 // Base score
    const factors: string[] = []

    // Sentiment impact
    if (sentiment.score < -0.5) {
      score += 2
      factors.push("Negative sentiment")
    }
    if (sentiment.urgency === "high") {
      score += 3
      factors.push("High urgency detected")
    }

    // Content analysis
    const content = email.content.toLowerCase()
    const subject = email.subject.toLowerCase()

    if (content.includes("urgent") || subject.includes("urgent")) {
      score += 3
      factors.push("Urgent language")
    }

    if (content.includes("asap") || content.includes("immediately")) {
      score += 2
      factors.push("Time-sensitive request")
    }

    if (content.includes("payment") || content.includes("billing")) {
      score += 2
      factors.push("Payment/billing issue")
    }

    if (content.includes("enterprise") || content.includes("fortune")) {
      score += 2
      factors.push("Enterprise customer")
    }

    if (content.includes("api") || content.includes("integration")) {
      score += 1
      factors.push("Technical integration")
    }

    // Sender analysis (mock VIP detection)
    if (email.sender.email.includes("enterprise") || email.sender.email.includes("corp")) {
      score += 1
      factors.push("Corporate sender")
    }

    // Clamp score and determine level
    const finalScore = Math.min(10, Math.max(1, score))
    let level: "low" | "medium" | "high" | "urgent"

    if (finalScore >= 8) level = "urgent"
    else if (finalScore >= 6) level = "high"
    else if (finalScore >= 4) level = "medium"
    else level = "low"

    return {
      level,
      score: finalScore,
      factors: factors.length > 0 ? factors : ["Standard priority"],
    }
  }
}

class ResponseGenerator {
  private templates: ResponseTemplate[] = [
    {
      id: "support-empathetic",
      name: "Empathetic Support Response",
      category: "support",
      tone: "professional",
      template: `Hi {customerName},

Thank you for reaching out about {issue}. I understand how {emotion} this must be for you.

{acknowledgment}

{solution}

{nextSteps}

If you need immediate assistance, please don't hesitate to contact us at {supportContact}.

Best regards,
{agentName}`,
      variables: [
        "customerName",
        "issue",
        "emotion",
        "acknowledgment",
        "solution",
        "nextSteps",
        "supportContact",
        "agentName",
      ],
      useCase: "Frustrated or upset customers with technical issues",
    },
    {
      id: "sales-demo",
      name: "Sales Demo Response",
      category: "sales",
      tone: "professional",
      template: `Hi {customerName},

Thank you for your interest in {product}! I'm excited to help you explore how our solution can benefit {companyName}.

{valueProposition}

I'd love to schedule a personalized demo to show you exactly how {product} can {benefit}. 

Are you available for a 30-minute call this week? I have availability on {timeSlots}.

Looking forward to connecting!

Best regards,
{salesRep}`,
      variables: ["customerName", "product", "companyName", "valueProposition", "benefit", "timeSlots", "salesRep"],
      useCase: "Enterprise sales inquiries and demo requests",
    },
  ]

  async generateDraft(email: Email, tone: "professional" | "friendly" | "formal" | "casual"): Promise<DraftResponse> {
    // Simulate AI response generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const content = this.generateResponseContent(email, tone)
    const suggestions = this.generateSuggestions(email, tone)

    return {
      id: `draft-${Date.now()}`,
      emailId: email.id,
      content,
      tone,
      confidence: 0.85 + Math.random() * 0.1,
      suggestions,
      createdAt: new Date(),
      isEdited: false,
    }
  }

  private generateResponseContent(email: Email, tone: string): string {
    const senderName = email.sender.name.split(" ")[0]

    // Analyze email content for context
    const isUrgent = email.content.toLowerCase().includes("urgent") || email.priority.level === "urgent"
    const isComplaint = email.sentiment.score < -0.3
    const isTechnical = email.category.name === "Technical"
    const isSales = email.category.name === "Sales Inquiry"

    if (isSales) {
      return `Hi ${senderName},

Thank you for your interest in our Enterprise plan! I'm excited to help you explore how our AI-powered communication assistant can transform your team's email management.

For an organization of your size, our Enterprise solution offers:
• Advanced AI processing with custom models
• Unlimited email integrations and team members  
• Priority support with dedicated account management
• Custom reporting and analytics dashboards

I'd love to schedule a personalized demo to show you exactly how we can streamline your communication workflow and save your team valuable time.

Are you available for a 30-minute call this week? I have availability on Tuesday at 2 PM EST or Thursday at 10 AM EST.

Looking forward to connecting!

Best regards,
Sales Team`
    }

    if (isTechnical) {
      return `Hi ${senderName},

Thank you for reaching out about the API integration issue. I understand how important it is to get this resolved quickly.

A 401 error typically indicates an authentication problem. Here are the most common solutions:

1. **API Key Format**: Ensure your API key is included in the Authorization header as: \`Bearer YOUR_API_KEY\`
2. **Key Expiration**: Check if your API key has expired in your dashboard settings
3. **Endpoint URL**: Verify you're using the correct base URL: \`https://api.yourcompany.com/v1/\`

I've also sent you our updated integration guide with code examples for common frameworks.

If you're still experiencing issues after trying these steps, please share your request headers (without the actual API key) and I'll help you troubleshoot further.

Best regards,
Technical Support Team`
    }

    if (isComplaint && isUrgent) {
      return `Hi ${senderName},

Thank you for reaching out, and I sincerely apologize for the frustration you've experienced. I understand how urgent this is for your team, and I'm here to help resolve this immediately.

I've escalated your case to our priority support team and assigned it the highest priority. You should expect an update within the next 30 minutes.

In the meantime, I've also:
• Temporarily extended your service access to prevent any disruption
• Assigned a dedicated support specialist to your case
• Set up monitoring to prevent similar issues in the future

For immediate assistance, please call our priority support line at (555) 123-4567 and reference case #${Math.random().toString(36).substr(2, 9).toUpperCase()}.

We truly value your business and are committed to making this right.

Best regards,
Priority Support Team`
    }

    // Default professional response
    return `Hi ${senderName},

Thank you for your email regarding "${email.subject}".

I've received your message and understand your inquiry. Our team is reviewing the details and will provide you with a comprehensive response shortly.

${isUrgent ? "Given the urgent nature of your request, I've prioritized this for immediate attention." : "We typically respond to inquiries within 24 hours during business days."}

If you have any additional information that might help us assist you better, please don't hesitate to share it.

Thank you for your patience.

Best regards,
Support Team`
  }

  private generateSuggestions(email: Email, tone: string): string[] {
    const suggestions: string[] = []

    if (email.sentiment.score < -0.3) {
      suggestions.push("Consider adding more empathetic language to acknowledge the customer's frustration")
      suggestions.push("Offer a direct phone number or escalation path for urgent issues")
    }

    if (email.category.name === "Sales Inquiry") {
      suggestions.push("Include specific value propositions relevant to their company size")
      suggestions.push("Mention case studies or testimonials from similar customers")
    }

    if (email.category.name === "Technical") {
      suggestions.push("Provide step-by-step troubleshooting instructions")
      suggestions.push("Include links to relevant documentation or code examples")
    }

    if (email.priority.level === "urgent") {
      suggestions.push("Set clear expectations for response timeline")
      suggestions.push("Provide alternative contact methods for immediate assistance")
    }

    suggestions.push("Personalize the greeting with the customer's name")
    suggestions.push("End with a clear call-to-action or next steps")

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }
}

// Global AI processor instance
export const aiProcessor = new AIProcessor()
