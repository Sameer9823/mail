import mongoose from "mongoose"
import { logger } from "../utils/logger.js"

class Database {
  constructor() {
    this.connection = null
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI

      if (!mongoUri) {
        logger.error("❌ MONGODB_URI not found in environment variables")
        process.exit(1)
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }

      await mongoose.connect(mongoUri, options)
      this.connection = mongoose.connection

      this.connection.on("connected", () => {
        logger.info("✅ MongoDB connected successfully")
        logger.info(`📊 Database: ${this.connection.name}`)
        logger.info(`🌐 Host: ${this.connection.host}:${this.connection.port}`)
      })

      // Errors
      this.connection.on("error", (err) => {
        logger.error("❌ MongoDB connection error:", err)
      })

      // Disconnection events
      this.connection.on("disconnected", () => {
        logger.warn("⚠️ MongoDB disconnected")
      })

      this.connection.on("reconnected", () => {
        logger.info("🔄 MongoDB reconnected")
      })

      return this.connection
    } catch (error) {
      logger.error("❌ MongoDB connection failed:", error.message)
      process.exit(1)
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect()
      logger.info("📴 MongoDB disconnected gracefully")
    } catch (error) {
      logger.error("❌ Error disconnecting from MongoDB:", error.message)
    }
  }

  getConnection() {
    return this.connection
  }

  isConnected() {
    return mongoose.connection.readyState === 1
  }
}

export default new Database()
