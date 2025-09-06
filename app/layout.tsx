import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "AI Communication Assistant",
  description: "AI-powered email management and communication platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-gray-900 text-gray-200`}
      >
        <div className="flex h-screen">
          {/* Sidebar */}
          <Suspense fallback={<div className="p-4 text-gray-400">Loading sidebar...</div>}>
            <NavigationSidebar />
          </Suspense>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm px-6 py-3 flex items-center justify-end">
              <RealTimeNotifications />
            </header>

            {/* Main */}
            <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {children}
            </main>
          </div>
        </div>

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
