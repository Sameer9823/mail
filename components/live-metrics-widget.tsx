"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Mail, Clock, Brain, Target } from "lucide-react"
import { type LiveMetric, realTimeService } from "@/lib/real-time"

export function LiveMetricsWidget() {
  const [metrics, setMetrics] = useState<LiveMetric[]>([])

  useEffect(() => {
    // Load initial metrics
    setMetrics(realTimeService.getMetrics())

    // Subscribe to metric updates
    const unsubscribe = realTimeService.subscribe("metric_update", (metric: LiveMetric) => {
      setMetrics((prev) => {
        const index = prev.findIndex((m) => m.name === metric.name)
        if (index >= 0) {
          const newMetrics = [...prev]
          newMetrics[index] = metric
          return newMetrics
        } else {
          return [...prev, metric]
        }
      })
    })

    return unsubscribe
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string, isPositive = true) => {
    if (trend === "stable") return "text-gray-500"

    const isGoodTrend = (trend === "up" && isPositive) || (trend === "down" && !isPositive)
    return isGoodTrend ? "text-green-500" : "text-red-500"
  }

  const getMetricIcon = (name: string) => {
    switch (name) {
      case "unread_count":
        return <Mail className="h-5 w-5 text-blue-500" />
      case "response_time":
        return <Clock className="h-5 w-5 text-orange-500" />
      case "ai_accuracy":
        return <Brain className="h-5 w-5 text-purple-500" />
      case "sentiment_score":
        return <Target className="h-5 w-5 text-green-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
    }
  }

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case "response_time":
        return `${value.toFixed(1)}h`
      case "ai_accuracy":
      case "sentiment_score":
        return `${value.toFixed(1)}%`
      default:
        return Math.round(value).toString()
    }
  }

  const getMetricLabel = (name: string) => {
    switch (name) {
      case "unread_count":
        return "Unread Emails"
      case "response_time":
        return "Avg Response Time"
      case "ai_accuracy":
        return "AI Accuracy"
      case "sentiment_score":
        return "Sentiment Score"
      default:
        return name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const isResponseTime = metric.name === "response_time"
        const trendColor = getTrendColor(metric.trend, !isResponseTime)

        return (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{getMetricLabel(metric.name)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{formatMetricValue(metric.name, metric.value)}</p>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${trendColor}`}>
                        {metric.trend !== "stable" && (
                          <>
                            {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(metric.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">{getMetricIcon(metric.name)}</div>
              </div>

              {/* Live indicator */}
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">LIVE</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
