import { LiveActivityFeed } from "@/components/live-activity-feed"
import { LiveMetricsWidget } from "@/components/live-metrics-widget"

export default function LivePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Live Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights and team collaboration</p>
        </div>

        {/* Live Metrics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Live Metrics</h2>
          <LiveMetricsWidget />
        </div>

        {/* Activity Feed */}
        <LiveActivityFeed />
      </div>
    </div>
  )
}
