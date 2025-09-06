import mongoose from "mongoose"

const sentimentSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    label: {
      type: String,
      required: true,
      enum: ["positive", "negative", "neutral"],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    urgency: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
    },
    emotions: [
      {
        emotion: String,
        intensity: Number,
      },
    ],
  },
  { _id: false },
)

const prioritySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    factors: [
      {
        factor: String,
        weight: Number,
      },
    ],
  },
  { _id: false },
)

const categorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  { _id: false },
)

const senderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    avatar: {
      type: String,
      default: null,
    },
    organization: {
      type: String,
      default: null,
    },
  },
  { _id: false },
)

const extractedDetailsSchema = new mongoose.Schema(
  {
    keywords: [String],
    entities: [
      {
        text: String,
        type: String,
        confidence: Number,
      },
    ],
    topics: [String],
    language: {
      type: String,
      default: "en",
    },
    readingTime: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const aiResponseSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      required: true,
      enum: ["professional", "friendly", "empathetic", "formal", "casual"],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    model: {
      type: String,
      required: true,
    },
    tokens: {
      input: Number,
      output: Number,
      total: Number,
    },
  },
  { _id: false },
)

const emailSchema = new mongoose.Schema(
  {
    // Basic email information
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    threadId: {
      type: String,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    htmlContent: {
      type: String,
      maxlength: 100000,
    },

    // Sender and recipient information
    sender: {
      type: senderSchema,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    cc: [String],
    bcc: [String],

    // Timestamps
    dateReceived: {
      type: Date,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // AI Analysis
    sentiment: {
      type: sentimentSchema,
      required: true,
    },
    priority: {
      type: prioritySchema,
      required: true,
    },
    category: {
      type: categorySchema,
      required: true,
    },
    extractedDetails: {
      type: extractedDetailsSchema,
      required: true,
    },

    // AI Generated Response
    aiResponse: {
      type: aiResponseSchema,
      default: null,
    },

    // Status and metadata
    status: {
      type: String,
      required: true,
      enum: ["pending", "in-progress", "resolved", "archived"],
      default: "pending",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Processing metadata
    processedAt: {
      type: Date,
      default: null,
    },
    processingTime: {
      type: Number,
      default: 0,
    },

    // Gmail specific
    gmailLabels: [String],
    gmailMessageId: String,

    // Attachments
    attachments: [
      {
        filename: String,
        contentType: String,
        size: Number,
        attachmentId: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
emailSchema.index({ "sender.email": 1, dateReceived: -1 })
emailSchema.index({ status: 1, "priority.level": 1 })
emailSchema.index({ "category.id": 1, dateReceived: -1 })
emailSchema.index({ "sentiment.label": 1, dateReceived: -1 })
emailSchema.index({ tags: 1 })
emailSchema.index({ dateReceived: -1 })
emailSchema.index({ createdAt: -1 })

// Virtual for response time calculation
emailSchema.virtual("responseTime").get(function () {
  if (this.status === "resolved" && this.aiResponse) {
    return this.aiResponse.generatedAt - this.dateReceived
  }
  return null
})

// Virtual for age calculation
emailSchema.virtual("age").get(function () {
  return Date.now() - this.dateReceived
})

// Pre-save middleware
emailSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "resolved") {
    this.processedAt = new Date()
  }
  next()
})

// Static methods
emailSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
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
        avgResponseTime: {
          $avg: {
            $cond: [{ $eq: ["$status", "resolved"] }, { $subtract: ["$processedAt", "$dateReceived"] }, null],
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
      avgResponseTime: 0,
    }
  )
}

emailSchema.statics.getSentimentDistribution = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$sentiment.label",
        count: { $sum: 1 },
      },
    },
  ])
}

emailSchema.statics.getPriorityDistribution = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$priority.level",
        count: { $sum: 1 },
      },
    },
  ])
}

const Email = mongoose.model("Email", emailSchema)

export default Email
