import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../utils/logger.js"

class AIService {
  constructor() {
    this.genAI = null
    this.model = null
    this.isInitialized = false
    this.initialize()
  }

  initialize() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        logger.warn("⚠️ GEMINI_API_KEY not found, AI services will be limited")
        return
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      })

      this.isInitialized = true
      logger.info("✅ Gemini AI Service initialized successfully")
    } catch (error) {
      logger.error("❌ Failed to initialize Gemini AI Service:", error.message)
    }
  }

  async analyzeSentiment(emailContent, subject = "") {
    if (!this.isInitialized) {
      return this.fallbackSentimentAnalysis(emailContent)
    }

    try {
      const prompt = `
Analyze the sentiment of this email and provide a detailed analysis:

Subject: ${subject}
Content: ${emailContent}

Please respond with a JSON object containing:
{
  "score": number between -1 (very negative) and 1 (very positive),
  "label": "positive" | "negative" | "neutral",
  "confidence": number between 0 and 1,
  "urgency": "low" | "medium" | "high" | "critical",
  "emotions": [{"emotion": "string", "intensity": number between 0 and 1}],
  "reasoning": "brief explanation of the analysis"
}

Focus on customer service context and identify urgency indicators like "urgent", "critical", "emergency", "asap", etc.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const parsedResult = JSON.parse(text)

      logger.info(`🎯 Gemini sentiment analysis completed for email`)
      return {
        score: parsedResult.score,
        label: parsedResult.label,
        confidence: parsedResult.confidence,
        urgency: parsedResult.urgency,
        emotions: parsedResult.emotions || [],
        reasoning: parsedResult.reasoning,
      }
    } catch (error) {
      logger.error("❌ Gemini sentiment analysis failed:", error.message)
      return this.fallbackSentimentAnalysis(emailContent)
    }
  }

  async categorizeEmail(emailContent, subject = "") {
    if (!this.isInitialized) {
      return this.fallbackCategorization(subject, emailContent)
    }

    try {
      const prompt = `
Categorize this customer service email into the most appropriate category:

Subject: ${subject}
Content: ${emailContent}

Available categories:
- technical-support: Technical issues, bugs, API problems, integration help
- billing: Payment issues, invoices, subscriptions, refunds, pricing
- general-inquiry: General questions, information requests, how-to questions
- feature-request: New feature suggestions, enhancements, improvements
- complaint: Complaints, dissatisfaction, service issues
- account-management: Account settings, profile changes, access issues
- sales-inquiry: Pre-sales questions, product information, demos

Respond with JSON:
{
  "category": {
    "id": "category-id",
    "name": "Category Name",
    "confidence": number between 0 and 1
  },
  "keywords": ["relevant", "keywords", "found"],
  "reasoning": "brief explanation"
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const parsedResult = JSON.parse(text)

      logger.info(`📂 Gemini categorization completed: ${parsedResult.category.name}`)
      return parsedResult
    } catch (error) {
      logger.error("❌ Gemini categorization failed:", error.message)
      return this.fallbackCategorization(subject, emailContent)
    }
  }

  async detectPriority(emailContent, subject = "", sentiment = null) {
    if (!this.isInitialized) {
      return this.fallbackPriorityDetection(subject, emailContent)
    }

    try {
      const prompt = `
Analyze the priority level of this customer service email:

Subject: ${subject}
Content: ${emailContent}
${sentiment ? `Sentiment: ${sentiment.label} (${sentiment.urgency} urgency)` : ""}

Consider these factors:
- Urgency keywords (urgent, critical, emergency, asap, immediately)
- Business impact (revenue loss, system down, security issue)
- Customer tier (enterprise, premium, standard)
- Issue severity (blocking, major, minor)
- Time sensitivity (deadline mentioned, SLA requirements)

Respond with JSON:
{
  "priority": {
    "level": "low" | "medium" | "high" | "urgent",
    "score": number between 1 and 10,
    "factors": [{"factor": "string", "weight": number, "description": "string"}]
  },
  "reasoning": "detailed explanation",
  "recommendedSLA": "response time recommendation"
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const parsedResult = JSON.parse(text)

      logger.info(
        `⚡ Gemini priority detection completed: ${parsedResult.priority.level} (${parsedResult.priority.score}/10)`,
      )
      return parsedResult
    } catch (error) {
      logger.error("❌ Gemini priority detection failed:", error.message)
      return this.fallbackPriorityDetection(subject, emailContent)
    }
  }

  async extractDetails(emailContent, subject = "") {
    if (!this.isInitialized) {
      return this.fallbackDetailsExtraction(emailContent)
    }

    try {
      const prompt = `
Extract key details and entities from this customer service email:

Subject: ${subject}
Content: ${emailContent}

Respond with JSON:
{
  "keywords": ["important", "keywords", "from", "content"],
  "entities": [
    {"text": "entity text", "type": "PERSON|ORGANIZATION|PRODUCT|ISSUE|DATE|EMAIL", "confidence": number}
  ],
  "topics": ["main", "topics", "discussed"],
  "language": "detected language code",
  "summary": "brief 1-2 sentence summary",
  "actionItems": ["specific", "actions", "requested"],
  "technicalTerms": ["api", "technical", "terms"],
  "customerInfo": {
    "name": "customer name if mentioned",
    "company": "company if mentioned",
    "accountType": "inferred account type"
  }
}

Focus on extracting actionable information and technical details.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const parsedResult = JSON.parse(text)

      // Calculate reading time
      const wordCount = emailContent.split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

      logger.info(`🔍 Gemini details extraction completed`)
      return {
        keywords: parsedResult.keywords || [],
        entities: parsedResult.entities || [],
        topics: parsedResult.topics || [],
        language: parsedResult.language || "en",
        readingTime,
        summary: parsedResult.summary,
        actionItems: parsedResult.actionItems || [],
        technicalTerms: parsedResult.technicalTerms || [],
        customerInfo: parsedResult.customerInfo || {},
      }
    } catch (error) {
      logger.error("❌ Gemini details extraction failed:", error.message)
      return this.fallbackDetailsExtraction(emailContent)
    }
  }

  async generateResponse(emailData, tone = "professional", context = {}) {
    if (!this.isInitialized) {
      return this.fallbackResponseGeneration(emailData, tone)
    }

    try {
      const { subject, content, sender, category, sentiment, priority } = emailData

      const prompt = `
Generate a professional customer service response to this email:

Original Email:
Subject: ${subject}
From: ${sender.name} <${sender.email}>
Content: ${content}

Context:
- Category: ${category?.name || "General Inquiry"}
- Sentiment: ${sentiment?.label || "neutral"} (${sentiment?.urgency || "medium"} urgency)
- Priority: ${priority?.level || "medium"}
- Tone requested: ${tone}

Guidelines:
1. Be ${tone}, empathetic, and helpful
2. Address the customer by name if available
3. Acknowledge their concern/request specifically
4. Provide clear next steps or solutions
5. Include appropriate contact information
6. Match the urgency level in your response
7. Keep it concise but comprehensive

Response should be:
- Professional email format
- 150-300 words
- Include subject line
- Ready to send

Respond with JSON:
{
  "subject": "Re: [original subject]",
  "content": "full email response in HTML format",
  "tone": "${tone}",
  "confidence": number between 0 and 1,
  "keyPoints": ["main", "points", "addressed"],
  "suggestedActions": ["follow", "up", "actions"],
  "estimatedResolutionTime": "time estimate if applicable"
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const parsedResult = JSON.parse(text)

      logger.info(`✍️ Gemini response generated for email: ${subject}`)
      return {
        content: parsedResult.content,
        subject: parsedResult.subject,
        tone,
        confidence: parsedResult.confidence,
        generatedAt: new Date(),
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        keyPoints: parsedResult.keyPoints || [],
        suggestedActions: parsedResult.suggestedActions || [],
        estimatedResolutionTime: parsedResult.estimatedResolutionTime,
        tokens: {
          input: 0, // Gemini doesn't provide token usage in the same way
          output: 0,
          total: 0,
        },
      }
    } catch (error) {
      logger.error("❌ Gemini response generation failed:", error.message)
      return this.fallbackResponseGeneration(emailData, tone)
    }
  }

  // Fallback methods for when AI service is not available
  fallbackSentimentAnalysis(content) {
    const positiveWords = ["thank", "great", "excellent", "good", "happy", "satisfied", "love", "amazing"]
    const negativeWords = ["problem", "issue", "error", "bug", "broken", "failed", "wrong", "terrible", "hate", "angry"]
    const urgentWords = ["urgent", "critical", "emergency", "asap", "immediately"]

    const lowerContent = content.toLowerCase()
    let score = 0
    let urgency = "low"

    positiveWords.forEach((word) => {
      if (lowerContent.includes(word)) score += 0.1
    })

    negativeWords.forEach((word) => {
      if (lowerContent.includes(word)) score -= 0.1
    })

    urgentWords.forEach((word) => {
      if (lowerContent.includes(word)) urgency = "high"
    })

    const label = score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral"

    return {
      score: Math.max(-1, Math.min(1, score)),
      label,
      confidence: 0.6,
      urgency,
      emotions: [],
    }
  }

  fallbackCategorization(subject, content) {
    const text = `${subject} ${content}`.toLowerCase()

    if (text.includes("bug") || text.includes("error") || text.includes("technical")) {
      return {
        category: { id: "technical-support", name: "Technical Support", confidence: 0.7 },
        keywords: ["technical", "bug", "error"],
      }
    }

    if (text.includes("billing") || text.includes("payment") || text.includes("invoice")) {
      return {
        category: { id: "billing", name: "Billing", confidence: 0.7 },
        keywords: ["billing", "payment"],
      }
    }

    return {
      category: { id: "general-inquiry", name: "General Inquiry", confidence: 0.5 },
      keywords: ["inquiry", "question"],
    }
  }

  fallbackPriorityDetection(subject, content) {
    const text = `${subject} ${content}`.toLowerCase()
    let score = 3

    if (text.includes("urgent") || text.includes("critical")) score = 9
    else if (text.includes("important") || text.includes("asap")) score = 7
    else if (text.includes("when possible") || text.includes("no rush")) score = 2

    const level = score >= 8 ? "urgent" : score >= 6 ? "high" : score >= 4 ? "medium" : "low"

    return {
      priority: {
        level,
        score,
        factors: [{ factor: "keyword-analysis", weight: 1, description: "Based on urgency keywords" }],
      },
    }
  }

  fallbackDetailsExtraction(content) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || []
    const keywords = words.filter((word) => word.length > 3).slice(0, 10)
    const wordCount = words.length

    return {
      keywords,
      entities: [],
      topics: [],
      language: "en",
      readingTime: Math.ceil(wordCount / 200),
      summary: content.substring(0, 100) + "...",
      actionItems: [],
      technicalTerms: [],
      customerInfo: {},
    }
  }

  fallbackResponseGeneration(emailData, tone) {
    const { sender, subject } = emailData

    return {
      content: `
<p>Dear ${sender.name || "Valued Customer"},</p>

<p>Thank you for contacting us regarding "${subject}". We have received your message and our team is reviewing your request.</p>

<p>We will get back to you within 24 hours with a detailed response. If this is an urgent matter, please don't hesitate to contact us directly.</p>

<p>Best regards,<br>
Customer Support Team</p>
      `,
      subject: `Re: ${subject}`,
      tone,
      confidence: 0.5,
      generatedAt: new Date(),
      model: "fallback",
      tokens: { input: 0, output: 0, total: 0 },
    }
  }

  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      provider: "Google Gemini AI",
    }
  }
}

export default new AIService()
