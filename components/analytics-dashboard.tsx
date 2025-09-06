"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Mail, Clock, Target, AlertTriangle, CheckCircle, Brain } from "lucide-react"

const emailVolumeData = [
  { name: "Mon", emails: 45, responses: 42 },
  { name: "Tue", emails: 52, responses: 48 },
  { name: "Wed", emails: 38, responses: 35 },
  { name: "Thu", emails: 61, responses: 58 },
  { name: "Fri", emails: 55, responses: 52 },
  { name: "Sat", emails: 23, responses: 20 },
  { name: "Sun", emails: 18, responses: 15 },
]

const sentimentTrendData = [
  { time: "00:00", positive: 65, neutral: 25, negative: 10 },
  { time: "04:00", positive: 70, neutral: 20, negative: 10 },
  { time: "08:00", positive: 45, neutral: 35, negative: 20 },
  { time: "12:00", positive: 40, neutral: 40, negative: 20 },
  { time: "16:00", positive: 50, neutral: 30, negative: 20 },
  { time: "20:00", positive: 60, neutral: 30, negative: 10 },
]

const categoryData = [
  { name: "Support", value: 35, color: "#3b82f6" },
  { name: "Sales", value: 25, color: "#10b981" },
  { name: "Technical", value: 20, color: "#8b5cf6" },
  { name: "Billing", value: 10, color: "#f59e0b" },
  { name: "Feedback", value: 8, color: "#ec4899" },
  { name: "Other", value: 2, color: "#6b7280" },
]

const responseTimeData = [
  { hour: "9 AM", avgTime: 2.1, target: 2.0 },
  { hour: "10 AM", avgTime: 1.8, target: 2.0 },
  { hour: "11 AM", avgTime: 2.3, target: 2.0 },
  { hour: "12 PM", avgTime: 2.8, target: 2.0 },
  { hour: "1 PM", avgTime: 3.2, target: 2.0 },
  { hour: "2 PM", avgTime: 2.5, target: 2.0 },
  { hour: "3 PM", avgTime: 2.1, target: 2.0 },
  { hour: "4 PM", avgTime: 1.9, target: 2.0 },
  { hour: "5 PM", avgTime: 2.4, target: 2.0 },
]

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive insights into your email communication performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                <p className="text-3xl font-bold">1,247</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+12.5%</span>
                  <span className="text-sm text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">2.4h</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">-8.2%</span>
                  <span className="text-sm text-muted-foreground">improvement</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-3xl font-bold">94.2%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+2.1%</span>
                  <span className="text-sm text-muted-foreground">this month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Accuracy</p>
                <p className="text-3xl font-bold">96.8%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+1.3%</span>
                  <span className="text-sm text-muted-foreground">this week</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Brain className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Email Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Email Volume Trend</CardTitle>
                <CardDescription>Daily email volume and response rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emailVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="emails" fill="#3b82f6" name="Received" />
                    <Bar dataKey="responses" fill="#10b981" name="Responded" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>Average response time vs target throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} name="Avg Time (hours)" />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Urgent</span>
                  <div className="flex items-center gap-2">
                    <Progress value={5} className="w-20 h-2" />
                    <span className="text-sm font-medium">5%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High</span>
                  <div className="flex items-center gap-2">
                    <Progress value={15} className="w-20 h-2" />
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium</span>
                  <div className="flex items-center gap-2">
                    <Progress value={45} className="w-20 h-2" />
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low</span>
                  <div className="flex items-center gap-2">
                    <Progress value={35} className="w-20 h-2" />
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Sarah Johnson</span>
                  </div>
                  <Badge variant="secondary">98.2%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">Mike Chen</span>
                  </div>
                  <Badge variant="secondary">96.8%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-sm">Alex Rodriguez</span>
                  </div>
                  <Badge variant="secondary">94.5%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm">Jennifer Walsh</span>
                  </div>
                  <Badge variant="secondary">92.1%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Peak Hours Alert</p>
                    <p className="text-xs text-muted-foreground">Response times spike at 1-2 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sentiment Improving</p>
                    <p className="text-xs text-muted-foreground">15% more positive feedback</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Auto-categorization</p>
                    <p className="text-xs text-muted-foreground">96.8% accuracy achieved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time by Category</CardTitle>
                <CardDescription>Average response times across different email categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Urgent Support", time: "18 min", color: "bg-red-500" },
                    { category: "Sales Inquiry", time: "1.2 hours", color: "bg-green-500" },
                    { category: "Technical", time: "2.8 hours", color: "bg-purple-500" },
                    { category: "Billing", time: "45 min", color: "bg-yellow-500" },
                    { category: "General", time: "3.2 hours", color: "bg-blue-500" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <Badge variant="outline">{item.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Efficiency</CardTitle>
                <CardDescription>First contact resolution rates by team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Sarah J.", rate: 94, emails: 156 },
                    { name: "Mike C.", rate: 91, emails: 142 },
                    { name: "Alex R.", rate: 88, emails: 134 },
                    { name: "Jennifer W.", rate: 85, emails: 128 },
                  ].map((member, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{member.name}</span>
                        <span className="text-sm text-muted-foreground">{member.emails} emails</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={member.rate} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{member.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis Over Time</CardTitle>
              <CardDescription>Customer sentiment trends throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={sentimentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="positive"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="neutral"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="negative"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Categories Distribution</CardTitle>
                <CardDescription>Breakdown of emails by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Response metrics by email category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <Badge variant="outline">{category.value}%</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Avg: 2.1h</span>
                        <span>Resolved: 94%</span>
                        <span>Satisfaction: 4.2/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
