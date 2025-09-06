import type { Email, SentimentAnalysis } from "./types"

export function getSentimentColor(sentiment: SentimentAnalysis): string {
  if (sentiment.score >= 0.3) return "text-green-500"
  if (sentiment.score <= -0.3) return "text-red-500"
  return "text-yellow-500"
}

export function getSentimentLabel(sentiment: SentimentAnalysis): string {
  if (sentiment.score >= 0.3) return "Positive"
  if (sentiment.score <= -0.3) return "Negative"
  return "Neutral"
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "text-red-500 bg-red-500/10"
    case "high":
      return "text-orange-500 bg-orange-500/10"
    case "medium":
      return "text-yellow-500 bg-yellow-500/10"
    case "low":
      return "text-green-500 bg-green-500/10"
    default:
      return "text-gray-500 bg-gray-500/10"
  }
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString()
}

export function filterEmailsByCategory(emails: Email[], categoryId: string): Email[] {
  return emails.filter((email) => email.category.id === categoryId)
}

export function filterEmailsByPriority(emails: Email[], priority: string): Email[] {
  return emails.filter((email) => email.priority.level === priority)
}

export function sortEmailsByPriority(emails: Email[]): Email[] {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
  return [...emails].sort((a, b) => {
    return priorityOrder[b.priority.level] - priorityOrder[a.priority.level]
  })
}

export function calculateResponseTime(emails: Email[]): number {
  // Mock calculation - in real app this would be based on actual response times
  return emails.length > 0 ? 2.4 : 0
}
