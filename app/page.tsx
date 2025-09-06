"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, CheckCircle, MessageSquare, Filter, SortDesc } from "lucide-react"
import { mockEmails, mockStats, emailCategories } from "@/lib/mock-data"
import { getSentimentColor, getSentimentLabel, getPriorityColor, formatTimeAgo } from "@/lib/email-utils"
import { aiProcessor } from "@/lib/ai-processing"

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(mockEmails[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null)

  const filteredEmails = mockEmails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || email.category.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleGenerateResponse = async () => {
    if (!selectedEmail) return
    setIsGeneratingResponse(true)
    try {
      const response = await aiProcessor.generateResponse(selectedEmail, "professional")
      setGeneratedResponse(response.content)
    } catch (error) {
      console.error("Failed to generate response:", error)
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  return (
    <div className="flex h-full bg-gray-900 text-gray-200">
      {/* Email List */}
      <div className="w-96 border-r border-gray-700 flex flex-col bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-white">Inbox</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <SortDesc className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-700 text-gray-200 placeholder-gray-400 border-gray-600 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-blue-400">{mockStats.unreadCount}</p>
              <p className="text-xs text-gray-400">Unread</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-400">{mockStats.todayCount}</p>
              <p className="text-xs text-gray-400">Today</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-400">{mockStats.avgResponseTime}h</p>
              <p className="text-xs text-gray-400">Avg Response</p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs"
            >
              All
            </Button>
            {emailCategories.slice(0, 4).map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs flex items-center gap-1"
              >
                <div className={`w-2 h-2 rounded-full ${category.color}`} />
                {category.name.split(" ")[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors rounded-md mb-1 ${
                selectedEmail.id === email.id ? "bg-gray-700 shadow-md" : ""
              } ${!email.isRead ? "bg-blue-900/10" : ""}`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 ring-1 ring-gray-600">
                  <AvatarImage src={email.sender.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {email.sender.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{email.sender.name}</p>
                    <span className="text-xs text-gray-400">{formatTimeAgo(email.timestamp)}</span>
                  </div>
                  <p className={`text-sm truncate mb-2 ${!email.isRead ? "font-medium text-white" : "text-gray-400"}`}>
                    {email.subject}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(email.priority.level)}`}>
                      {email.priority.level}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getSentimentColor(email.sentiment)}`}>
                      {getSentimentLabel(email.sentiment)}
                    </Badge>
                    {!email.isRead && <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedEmail && (
          <>
            {/* Email Header */}
            <div className="p-6 border-b border-gray-700 bg-gray-800 rounded-b-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 ring-1 ring-gray-600">
                    <AvatarImage src={selectedEmail.sender.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedEmail.sender.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedEmail.subject}</h2>
                    <p className="text-sm text-gray-400">
                      From: {selectedEmail.sender.name} &lt;{selectedEmail.sender.email}&gt;
                    </p>
                    <p className="text-sm text-gray-400">To: {selectedEmail.recipient}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedEmail.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(selectedEmail.priority.level)}>
                    {selectedEmail.priority.level} priority
                  </Badge>
                  <Badge variant="outline" className={selectedEmail.category.color}>
                    {selectedEmail.category.name}
                  </Badge>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Sentiment</p>
                  <p className={`text-lg font-bold ${getSentimentColor(selectedEmail.sentiment)}`}>
                    {getSentimentLabel(selectedEmail.sentiment)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {Math.round(selectedEmail.sentiment.confidence * 100)}% confidence
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Urgency</p>
                  <p className="text-lg font-bold capitalize">{selectedEmail.sentiment.urgency}</p>
                  <p className="text-xs text-gray-400">Score: {selectedEmail.priority.score}/10</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Category</p>
                  <p className="text-lg font-bold">{selectedEmail.category.name}</p>
                  <p className="text-xs text-gray-400">Auto-assigned</p>
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-200 leading-relaxed">{selectedEmail.content}</p>
              </div>

              {/* Tags */}
              {selectedEmail.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2 text-gray-300">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerateResponse}
                    disabled={isGeneratingResponse}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <MessageSquare className={`h-4 w-4 mr-2 ${isGeneratingResponse ? "animate-pulse" : ""}`} />
                    {isGeneratingResponse ? "Generating..." : "Generate AI Reply"}
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Forward
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Archive
                  </Button>
                </div>
              </div>

              {generatedResponse && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">AI Generated Response</h4>
                    <Badge variant="secondary" className="text-xs">
                      AI Generated
                    </Badge>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm text-gray-200">{generatedResponse}</pre>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white">
                      Use Response
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
