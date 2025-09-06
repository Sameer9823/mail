"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Send, Brain, User, Activity, Clock } from "lucide-react"
import { type ActivityEvent, type CollaborationEvent, realTimeService } from "@/lib/real-time"
import { formatTimeAgo } from "@/lib/email-utils"

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [collaborationEvents, setCollaborationEvents] = useState<CollaborationEvent[]>([])

  useEffect(() => {
    // Load initial data
    setActivities(realTimeService.getActivities())
    setCollaborationEvents(realTimeService.getCollaborationEvents())

    // Subscribe to new activities
    const unsubscribeActivity = realTimeService.subscribe("activity", (activity: ActivityEvent) => {
      setActivities((prev) => [activity, ...prev.slice(0, 49)])
    })

    const unsubscribeCollab = realTimeService.subscribe("collaboration", (event: CollaborationEvent) => {
      setCollaborationEvents((prev) => [event, ...prev.slice(0, 19)])
    })

    return () => {
      unsubscribeActivity()
      unsubscribeCollab()
    }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email_received":
        return <Mail className="h-4 w-4 text-blue-500" />
      case "email_sent":
        return <Send className="h-4 w-4 text-green-500" />
      case "email_processed":
        return <Brain className="h-4 w-4 text-purple-500" />
      case "ai_analysis":
        return <Brain className="h-4 w-4 text-orange-500" />
      case "user_action":
        return <User className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getCollaborationIcon = (type: string) => {
    switch (type) {
      case "user_viewing":
        return "👀"
      case "user_editing":
        return "✏️"
      case "user_typing":
        return "⌨️"
      case "user_online":
        return "🟢"
      case "user_offline":
        return "⚫"
      default:
        return "👤"
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Collaboration
          </CardTitle>
          <CardDescription>See what your team is working on in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            {collaborationEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent collaboration activity</p>
            ) : (
              <div className="space-y-2">
                {collaborationEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                    <div className="text-lg">{getCollaborationIcon(event.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{event.userName}</span>
                        {event.type === "user_viewing" && " is viewing an email"}
                        {event.type === "user_editing" && " is editing a response"}
                        {event.type === "user_typing" && " is typing..."}
                        {event.type === "user_online" && " came online"}
                        {event.type === "user_offline" && " went offline"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(event.timestamp)}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>Recent system and user activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50">
                    <div className="p-1.5 rounded-lg bg-muted">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.user && (
                          <Badge variant="outline" className="text-xs">
                            {activity.user}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
