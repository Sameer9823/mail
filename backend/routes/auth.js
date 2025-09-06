import express from "express"
import gmailService from "../services/gmailService.js"
import { logger } from "../utils/logger.js"

const router = express.Router()

// Get Gmail authorization URL
router.get("/gmail/url", (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl()
    res.json({ authUrl })
  } catch (error) {
    logger.error("❌ Failed to get Gmail auth URL:", error.message)
    res.status(500).json({ error: "Failed to generate authorization URL" })
  }
})

// Handle Gmail OAuth callback
router.get("/gmail/callback", async (req, res) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" })
    }

    const tokens = await gmailService.authenticate(code)

    logger.info("✅ Gmail authentication successful")

    // In production, you might want to store tokens securely
    res.json({
      message: "Gmail authentication successful",
      tokens: {
        access_token: tokens.access_token ? "***" : null,
        refresh_token: tokens.refresh_token ? "***" : null,
      },
    })
  } catch (error) {
    logger.error("❌ Gmail authentication failed:", error.message)
    res.status(400).json({ error: "Gmail authentication failed" })
  }
})

// Check Gmail authentication status
router.get("/gmail/status", (req, res) => {
  res.json({
    isAuthenticated: gmailService.isAuthenticated,
    hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN,
  })
})

// Refresh Gmail token
router.post("/gmail/refresh", async (req, res) => {
  try {
    const credentials = await gmailService.refreshAccessToken()
    res.json({
      message: "Token refreshed successfully",
      expiresAt: credentials.expiry_date,
    })
  } catch (error) {
    logger.error("❌ Failed to refresh Gmail token:", error.message)
    res.status(400).json({ error: "Failed to refresh token" })
  }
})

export default router
