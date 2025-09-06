"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, X, Check, AlertTriangle, Mail, Brain, Settings, Users } from "lucide-react"
import { type RealTimeNotification, realTimeService } from "@/lib/real-time"
import { formatTimeAgo } from "@/lib/email-utils"

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load initial notifications
    setNotifications(realTimeService.getNotifications())

    // Subscribe to new notifications
    const unsubscribe = realTimeService.subscribe("notification", (notification: RealTimeNotification) => {
      setNotifications((prev) => [notification, ...prev])

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        })
      }
    })

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return unsubscribe
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    realTimeService.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.read) {
        realTimeService.markNotificationRead(n.id)
      }
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_email":
      case "urgent_email":
        return <Mail className="h-4 w-4" />
      case "ai_insight":
        return <Brain className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
      case "collaboration":
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-500 bg-red-500/10"

    switch (type) {
      case "new_email":
      case "urgent_email":
        return "text-blue-500 bg-blue-500/10"
      case "ai_insight":
        return "text-purple-500 bg-purple-500/10"
      case "system":
        return "text-gray-500 bg-gray-500/10"
      case "collaboration":
        return "text-green-500 bg-green-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-500/5" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1">
                              {notification.priority === "high" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                              {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
