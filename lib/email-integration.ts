export interface EmailProvider {
  id: string
  name: string
  type: "gmail" | "outlook" | "imap" | "exchange"
  icon: string
  isConnected: boolean
  lastSync?: Date
  syncStatus: "idle" | "syncing" | "error" | "success"
  errorMessage?: string
  settings: {
    email: string
    server?: string
    port?: number
    ssl?: boolean
    folders: string[]
  }
  stats: {
    totalEmails: number
    newEmails: number
    syncFrequency: number // minutes
  }
}

export interface SyncResult {
  provider: string
  success: boolean
  emailsProcessed: number
  newEmails: number
  errors: string[]
  duration: number // milliseconds
}

export interface EmailConnection {
  id: string
  providerId: string
  status: "connected" | "disconnected" | "error" | "authenticating"
  lastActivity: Date
  credentials: {
    encrypted: boolean
    expiresAt?: Date
  }
}

// Mock email providers
export const mockProviders: EmailProvider[] = [
  {
    id: "gmail-1",
    name: "Gmail (Primary)",
    type: "gmail",
    icon: "📧",
    isConnected: true,
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    syncStatus: "success",
    settings: {
      email: "support@yourcompany.com",
      folders: ["INBOX", "Sent", "Drafts", "Spam"],
    },
    stats: {
      totalEmails: 1247,
      newEmails: 12,
      syncFrequency: 5,
    },
  },
  {
    id: "outlook-1",
    name: "Outlook (Sales)",
    type: "outlook",
    icon: "📮",
    isConnected: true,
    lastSync: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    syncStatus: "idle",
    settings: {
      email: "sales@yourcompany.com",
      folders: ["Inbox", "Sent Items", "Deleted Items"],
    },
    stats: {
      totalEmails: 892,
      newEmails: 5,
      syncFrequency: 10,
    },
  },
  {
    id: "imap-1",
    name: "IMAP Server",
    type: "imap",
    icon: "🔧",
    isConnected: false,
    syncStatus: "error",
    errorMessage: "Authentication failed",
    settings: {
      email: "technical@yourcompany.com",
      server: "mail.yourcompany.com",
      port: 993,
      ssl: true,
      folders: ["INBOX", "SENT", "DRAFTS"],
    },
    stats: {
      totalEmails: 0,
      newEmails: 0,
      syncFrequency: 15,
    },
  },
]

// Email integration service
export class EmailIntegrationService {
  private providers: EmailProvider[] = mockProviders
  private syncInterval: NodeJS.Timeout | null = null

  async connectProvider(providerId: string, credentials: any): Promise<boolean> {
    const provider = this.providers.find((p) => p.id === providerId)
    if (!provider) return false

    // Simulate connection process
    provider.syncStatus = "syncing"

    return new Promise((resolve) => {
      setTimeout(() => {
        provider.isConnected = true
        provider.syncStatus = "success"
        provider.lastSync = new Date()
        resolve(true)
      }, 2000)
    })
  }

  async disconnectProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.find((p) => p.id === providerId)
    if (!provider) return false

    provider.isConnected = false
    provider.syncStatus = "idle"
    provider.lastSync = undefined
    return true
  }

  async syncProvider(providerId: string): Promise<SyncResult> {
    const provider = this.providers.find((p) => p.id === providerId)
    if (!provider || !provider.isConnected) {
      throw new Error("Provider not connected")
    }

    provider.syncStatus = "syncing"
    const startTime = Date.now()

    return new Promise((resolve) => {
      setTimeout(() => {
        const newEmails = Math.floor(Math.random() * 10) + 1
        const result: SyncResult = {
          provider: provider.name,
          success: true,
          emailsProcessed: provider.stats.totalEmails + newEmails,
          newEmails,
          errors: [],
          duration: Date.now() - startTime,
        }

        provider.stats.newEmails += newEmails
        provider.stats.totalEmails += newEmails
        provider.lastSync = new Date()
        provider.syncStatus = "success"

        resolve(result)
      }, 3000)
    })
  }

  async syncAllProviders(): Promise<SyncResult[]> {
    const connectedProviders = this.providers.filter((p) => p.isConnected)
    const results: SyncResult[] = []

    for (const provider of connectedProviders) {
      try {
        const result = await this.syncProvider(provider.id)
        results.push(result)
      } catch (error) {
        results.push({
          provider: provider.name,
          success: false,
          emailsProcessed: 0,
          newEmails: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          duration: 0,
        })
      }
    }

    return results
  }

  getProviders(): EmailProvider[] {
    return this.providers
  }

  getProvider(id: string): EmailProvider | undefined {
    return this.providers.find((p) => p.id === id)
  }

  startAutoSync(): void {
    if (this.syncInterval) return

    this.syncInterval = setInterval(async () => {
      const connectedProviders = this.providers.filter((p) => p.isConnected)

      for (const provider of connectedProviders) {
        const timeSinceLastSync = provider.lastSync
          ? Date.now() - provider.lastSync.getTime()
          : Number.POSITIVE_INFINITY

        const syncIntervalMs = provider.stats.syncFrequency * 60 * 1000

        if (timeSinceLastSync >= syncIntervalMs) {
          try {
            await this.syncProvider(provider.id)
          } catch (error) {
            console.error(`Auto-sync failed for ${provider.name}:`, error)
          }
        }
      }
    }, 30000) // Check every 30 seconds
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Global instance
export const emailService = new EmailIntegrationService()
