"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Settings,
  Brain,
  Zap,
  Users,
  MessageSquare,
  Archive,
  Star,
  Send,
  Inbox,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    title: "Email Management",
    items: [
      { name: "Inbox", href: "/", icon: Inbox, badge: "23" },
      { name: "Sent", href: "/sent", icon: Send },
      { name: "Starred", href: "/starred", icon: Star, badge: "5" },
      { name: "Archive", href: "/archive", icon: Archive },
    ],
  },
  {
    title: "AI Features",
    items: [
      { name: "AI Insights", href: "/ai-insights", icon: Brain, badge: "New" },
      { name: "Auto Responses", href: "/auto-responses", icon: MessageSquare },
      { name: "Smart Categories", href: "/categories", icon: Zap },
    ],
  },
  {
    title: "Analytics",
    items: [
      { name: "Dashboard", href: "/analytics", icon: BarChart3 },
      { name: "Performance", href: "/performance", icon: TrendingUp },
      { name: "Team Stats", href: "/team", icon: Users },
      { name: "Live Dashboard", href: "/live", icon: Activity, badge: "Live" },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "Integration", href: "/integration", icon: Settings },
      { name: "Preferences", href: "/preferences", icon: Settings },
    ],
  },
]

const quickActions = [
  { name: "Urgent Emails", count: 3, color: "text-red-500", icon: AlertTriangle },
  { name: "Pending Review", count: 8, color: "text-yellow-500", icon: Clock },
  { name: "Resolved Today", count: 24, color: "text-green-500", icon: CheckCircle },
]

export function NavigationSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-800 text-gray-200 border-r border-gray-700 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm">AI Assistant</h2>
              <p className="text-xs text-gray-400">Communication Hub</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xs font-medium text-gray-400 mb-3">QUICK OVERVIEW</h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <action.icon className={cn("h-4 w-4", action.color)} />
                  <span className="text-sm">{action.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {action.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
        <nav className="space-y-6">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!collapsed && (
                <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={itemIndex} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 hover:bg-gray-700 transition-colors",
                          collapsed && "justify-center px-2",
                          isActive && "bg-blue-600 text-white shadow-md",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            {item.badge && (
                              <Badge
                                variant={item.badge === "Live" ? "default" : "secondary"}
                                className={cn(
                                  "text-xs",
                                  item.badge === "Live" && "bg-green-500 text-white animate-pulse",
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
              {sectionIndex < navigationItems.length - 1 && !collapsed && (
                <Separator className="mt-4 border-gray-700" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
        >
          {collapsed ? "→" : "←"}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </div>
  )
}
