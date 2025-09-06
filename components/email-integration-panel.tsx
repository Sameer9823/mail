"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RefreshCw,
  Settings,
  Plus,
  Wifi,
  WifiOff,
  Clock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Server,
  Shield,
} from "lucide-react"
import { type EmailProvider, type SyncResult, emailService } from "@/lib/email-integration"

export function EmailIntegrationPanel() {
  const [providers, setProviders] = useState<EmailProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [showAddProvider, setShowAddProvider] = useState(false)

  useEffect(() => {
    setProviders(emailService.getProviders())

    if (autoSyncEnabled) {
      emailService.startAutoSync()
    }

    return () => {
      emailService.stopAutoSync()
    }
  }, [autoSyncEnabled])

  const handleSyncProvider = async (providerId: string) => {
    setIsLoading(true)
    try {
      const result = await emailService.syncProvider(providerId)
      setSyncResults((prev) => [result, ...prev.slice(0, 4)])
      setProviders(emailService.getProviders())
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setIsLoading(true)
    try {
      const results = await emailService.syncAllProviders()
      setSyncResults((prev) => [...results, ...prev.slice(0, 2)])
      setProviders(emailService.getProviders())
    } catch (error) {
      console.error("Sync all failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectProvider = async (providerId: string) => {
    setIsLoading(true)
    try {
      await emailService.connectProvider(providerId, {})
      setProviders(emailService.getProviders())
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (provider: EmailProvider) => {
    if (!provider.isConnected) return <WifiOff className="h-4 w-4 text-red-500" />

    switch (provider.syncStatus) {
      case "syncing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (provider: EmailProvider) => {
    if (!provider.isConnected) return "bg-red-500/10 text-red-500"

    switch (provider.syncStatus) {
      case "syncing":
        return "bg-blue-500/10 text-blue-500"
      case "success":
        return "bg-green-500/10 text-green-500"
      case "error":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Integration</h2>
          <p className="text-muted-foreground">Manage your email connections and synchronization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-sync">Auto Sync</Label>
            <Switch id="auto-sync" checked={autoSyncEnabled} onCheckedChange={setAutoSyncEnabled} />
          </div>
          <Button onClick={handleSyncAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync All
          </Button>
          <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email Provider</DialogTitle>
                <DialogDescription>Connect a new email account or server to sync emails</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Mail className="h-6 w-6" />
                    Gmail
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Mail className="h-6 w-6" />
                    Outlook
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Server className="h-6 w-6" />
                    IMAP
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <Shield className="h-6 w-6" />
                    Exchange
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{provider.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.settings.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(provider)}>
                        {getStatusIcon(provider)}
                        <span className="ml-1 capitalize">
                          {provider.isConnected ? provider.syncStatus : "disconnected"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{provider.stats.totalEmails}</p>
                      <p className="text-sm text-muted-foreground">Total Emails</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{provider.stats.newEmails}</p>
                      <p className="text-sm text-muted-foreground">New Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-500">{provider.stats.syncFrequency}m</p>
                      <p className="text-sm text-muted-foreground">Sync Interval</p>
                    </div>
                  </div>

                  {provider.lastSync && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      Last synced: {provider.lastSync.toLocaleString()}
                    </div>
                  )}

                  {provider.errorMessage && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{provider.errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2">
                    {provider.isConnected ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSyncProvider(provider.id)}
                          disabled={isLoading || provider.syncStatus === "syncing"}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-2 ${provider.syncStatus === "syncing" ? "animate-spin" : ""}`}
                          />
                          Sync Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleConnectProvider(provider.id)} disabled={isLoading}>
                        <Wifi className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>Latest synchronization results from all providers</CardDescription>
            </CardHeader>
            <CardContent>
              {syncResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sync history available</p>
              ) : (
                <div className="space-y-4">
                  {syncResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{result.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.success
                              ? `Processed ${result.emailsProcessed} emails, ${result.newEmails} new`
                              : `Failed: ${result.errors.join(", ")}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{result.duration}ms</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>Configure how emails are synchronized across providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync-global">Enable Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">Automatically sync emails at regular intervals</p>
                </div>
                <Switch id="auto-sync-global" checked={autoSyncEnabled} onCheckedChange={setAutoSyncEnabled} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-interval">Default Sync Interval (minutes)</Label>
                <Input id="sync-interval" type="number" defaultValue="5" min="1" max="60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-emails">Max Emails Per Sync</Label>
                <Input id="max-emails" type="number" defaultValue="100" min="10" max="1000" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-attachments">Sync Attachments</Label>
                  <p className="text-sm text-muted-foreground">Download and process email attachments</p>
                </div>
                <Switch id="sync-attachments" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="real-time">Real-time Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified immediately when new emails arrive</p>
                </div>
                <Switch id="real-time" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
