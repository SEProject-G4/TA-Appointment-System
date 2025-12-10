import type { Request, Response, NextFunction } from "express";
const User = require("../models/User");
const authService = require("../services/authService");
import NodeCache = require("node-cache");
import type { IUser } from "../models/User";

// User cache - 15 minutes TTL
const userCache = new NodeCache({
  stdTTL: 900, // 15 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects (better performance)
});

// Session cache to avoid repeated DB queries
const sessionUserCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 60,
  useClones: false,
});

export const protectedMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  if (!req.session?.userId) {
    console.log("❌ Authentication failed - no session");
    return res.status(401).json({ error: "Not authorized, no session" });
  }

  const userId = req.session.userId;
  const cacheKey = `user:${userId}`;

  try {
    // Check cache first
    let user = userCache.get<IUser>(cacheKey);

    if (!user) {
      console.log("💾 Cache miss for user:", userId);
      // Cache miss - fetch from database
      user = await authService.findUserByIdOptimized(userId);
      if (!user) {
        console.log("❌ User not found in database:", userId);
        req.session.destroy((err) => {
          if (err) console.error("Session destroy error:", err);
        });
        return res.status(404).json({ error: "User not found" });
      }

      // Cache the user data
      userCache.set(cacheKey, user);
      console.log("✅ User cached:", user.email);
    } else {
      console.log("🚀 Cache hit for user:", user.email);
    }

    // Attach user to request
    (req as any).user = user;

    // Update session activity timestamp
    if (req.session) {
      (req.session as any).lastActivity = new Date();
    }

    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const authorize = (roles: string | string[] = []) => {
  const roleArray = typeof roles === "string" ? [roles] : roles;

  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "No user data found in request" });
    }

    if (roleArray.length > 0 && !roleArray.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden: You do not have the required role",
        required: roleArray,
        current: user.role,
      });
    }

    next();
  };
};

// Middleware to invalidate user cache when user data changes
export const invalidateUserCache = (userId: string): void => {
  const cacheKey = `user:${userId}`;
  userCache.del(cacheKey);
  sessionUserCache.del(cacheKey);
  console.log(`Cache invalidated for user: ${userId}`);
};

// Optional: Session activity tracking
export const trackActivity = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.userId) {
    (req.session as any).lastActivity = new Date();
    (req.session as any).requestCount = ((req.session as any).requestCount || 0) + 1;
  }
  next();
};

// Session cleanup utility
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    // This will be handled by MongoDB TTL, but you can add custom logic here
    console.log("Session cleanup completed");
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
};

// Cache statistics for monitoring
export const getCacheStats = () => {
  return {
    userCache: userCache.getStats(),
    sessionCache: sessionUserCache.getStats(),
  };
};

// Alias for backwards compatibility
// Note: 'protected' is a reserved keyword in TypeScript, so we export as protectedMiddleware
// and provide it as a property in the default export

module.exports = {
  protected: protectedMiddleware,
  protectedMiddleware,
  authorize,
  invalidateUserCache,
  trackActivity,
  cleanupExpiredSessions,
  getCacheStats,
};
