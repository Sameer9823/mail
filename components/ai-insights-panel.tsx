"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  MessageSquare,
  Lightbulb,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { type AIInsight, type AIProcessingResult, aiProcessor } from "@/lib/ai-processing"
import { mockEmails } from "@/lib/mock-data"

// Icon map for insight types
const insightIcons: Record<string, JSX.Element> = {
  sentiment: <Brain className="h-4 w-4" />,
  priority: <AlertTriangle className="h-4 w-4" />,
  category: <Target className="h-4 w-4" />,
  response_suggestion: <MessageSquare className="h-4 w-4" />,
  trend: <TrendingUp className="h-4 w-4" />,
}

// Color map for insight types
const insightColors: Record<string, string> = {
  sentiment: "text-purple-400 bg-purple-400/10",
  priority: "text-red-400 bg-red-400/10",
  category: "text-blue-400 bg-blue-400/10",
  response_suggestion: "text-green-400 bg-green-400/10",
  trend: "text-orange-400 bg-orange-400/10",
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [processingResults, setProcessingResults] = useState<AIProcessingResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  useEffect(() => {
    loadInitialInsights()
  }, [])

  const loadInitialInsights = async () => {
    const mockInsights: AIInsight[] = [
      {
        id: "1",
        type: "sentiment",
        title: "Negative Sentiment Spike",
        description:
          "15% increase in negative sentiment emails over the past 24 hours. Most common issues: payment processing and API errors.",
        confidence: 0.92,
        actionable: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "2",
        type: "priority",
        title: "High Priority Queue Building",
        description:
          "8 urgent emails in queue. Average response time for urgent emails: 45 minutes (target: 30 minutes).",
        confidence: 0.98,
        actionable: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: "3",
        type: "trend",
        title: "Enterprise Inquiries Trending",
        description: "3x increase in enterprise sales inquiries this week. Consider allocating more sales resources.",
        confidence: 0.87,
        actionable: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ]
    setInsights(mockInsights)
  }

  const processAllEmails = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const results: AIProcessingResult[] = []
      const allInsights: AIInsight[] = []

      for (let i = 0; i < mockEmails.length; i++) {
        const email = mockEmails[i]
        const result = await aiProcessor.processEmail(email)
        results.push(result)
        allInsights.push(...result.insights)

        // Update progress
        setProcessingProgress(((i + 1) / mockEmails.length) * 100)
      }

      setProcessingResults(results)
      setInsights((prev) => [...allInsights, ...prev].slice(0, 10)) // Keep last 10 insights
    } catch (error) {
      console.error("Processing failed:", error)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  return (
    <div className="space-y-6 bg-background text-foreground min-h-screen p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Insights</h2>
          <p className="text-muted-foreground">
            AI-powered analysis and recommendations for your email workflow
          </p>
        </div>
        <Button
          onClick={processAllEmails}
          disabled={isProcessing}
          className="bg-card text-card-foreground hover:bg-muted transition-colors flex items-center"
        >
          <Brain className={`h-4 w-4 mr-2 ${isProcessing ? "animate-pulse" : ""}`} />
          {isProcessing ? "Processing..." : "Analyze All Emails"}
        </Button>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-card-foreground">
                <span>Processing emails with AI...</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="h-2 bg-muted transition-all duration-500" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="bg-card rounded-lg border-border">
          <TabsTrigger value="insights" className="text-foreground">
            Live Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-foreground">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-foreground">
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <KeyMetrics processingResults={processingResults} />
          <InsightsList insights={insights} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsCharts />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Recommendations />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ------------------- Key Metrics -------------------

function KeyMetrics({ processingResults }: { processingResults: AIProcessingResult[] }) {
  const avgProcessingTime =
    processingResults.length > 0
      ? Math.round(processingResults.reduce((acc, r) => acc + r.processingTime, 0) / processingResults.length)
      : 0
  const urgentEmails = processingResults.filter((r) => r.priority.level === "urgent").length
  const positivePercent =
    processingResults.length > 0
      ? Math.round((processingResults.filter((r) => r.sentiment.score > 0).length / processingResults.length) * 100)
      : 0

  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { icon: <Brain className="h-5 w-5 text-purple-400" />, value: processingResults.length, label: "Emails Processed" },
        { icon: <Zap className="h-5 w-5 text-yellow-400" />, value: avgProcessingTime + " ms", label: "Avg Processing Time" },
        { icon: <AlertTriangle className="h-5 w-5 text-red-400" />, value: urgentEmails, label: "Urgent Emails" },
        { icon: <TrendingUp className="h-5 w-5 text-green-400" />, value: positivePercent + "%", label: "Positive Sentiment" },
      ].map((item, idx) => (
        <Card key={idx} className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {item.icon}
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ------------------- Insights List -------------------

function InsightsList({ insights }: { insights: AIInsight[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-foreground" />
          Live Insights
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Real-time AI analysis and actionable recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No insights available. Process some emails to see AI analysis.
          </p>
        ) : (
          <div className="space-y-4">
            {insights.slice(0, 5).map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer border-border"
              >
                <div className={`p-2 rounded-lg ${insightColors[insight.type]}`}>{insightIcons[insight.type]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="secondary" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(insight.createdAt, { addSuffix: true })}
                    </span>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ------------------- Analytics Charts -------------------

function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Sentiment Distribution */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription className="text-muted-foreground">Distribution of email sentiments</CardDescription>
        </CardHeader>
        <CardContent>
          {[
            { label: "Positive", color: "bg-green-500", value: 45 },
            { label: "Neutral", color: "bg-yellow-500", value: 35 },
            { label: "Negative", color: "bg-red-500", value: 20 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Priority Levels</CardTitle>
          <CardDescription className="text-muted-foreground">Email priority distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {[
            { label: "Urgent", color: "bg-red-500", value: 5 },
            { label: "High", color: "bg-orange-500", value: 15 },
            { label: "Medium", color: "bg-yellow-500", value: 45 },
            { label: "Low", color: "bg-green-500", value: 35 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ------------------- Recommendations -------------------

function Recommendations() {
  return (
    <div className="grid gap-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Workflow Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Implement Auto-Categorization</h4>
                <p className="text-sm text-muted-foreground">
                  95% accuracy achieved in email categorization. Enable auto-assignment to reduce manual sorting by 80%.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Priority Queue Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Urgent emails detected 2.3 seconds faster with AI. Consider enabling real-time priority alerts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Response Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Template Suggestions</h4>
                <p className="text-sm text-muted-foreground">
                  AI-generated responses show 40% faster resolution times. Enable smart templates for common issues.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Sentiment-Aware Responses</h4>
                <p className="text-sm text-muted-foreground">
                  Negative sentiment emails need empathetic language. AI can suggest tone adjustments automatically.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
