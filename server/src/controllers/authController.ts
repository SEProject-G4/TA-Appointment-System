import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
const config = require("../config/index");
const authService = require("../services/authService");
const { invalidateUserCache } = require("../middleware/authMiddleware");
import crypto = require("crypto");

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

interface SecurityEventDetails {
  [key: string]: any;
}

// Enhanced security logging
const logSecurityEvent = (type: string, details: SecurityEventDetails, req: Request): void => {
  const logData = {
    type,
    timestamp: new Date().toISOString(),
    ip: req.ip || (req.connection as any).remoteAddress,
    userAgent: req.get("User-Agent"),
    sessionId: req.sessionID,
    ...details,
  };

  console.log(`SECURITY EVENT [${type}]:`, JSON.stringify(logData));

  // In production, you might want to send this to a security monitoring service
  // securityMonitoring.log(logData);
};

const googleVerify = async (req: Request, res: Response): Promise<Response> => {
  const { id_token } = req.body;

  if (!id_token) {
    logSecurityEvent("AUTH_MISSING_TOKEN", {}, req);
    return res.status(400).json({ error: "ID token is required" });
  }

  try {
    // Verify Google token
    if (!config.GOOGLE_CLIENT_ID) {
      logSecurityEvent("AUTH_CONFIG_ERROR", { error: "GOOGLE_CLIENT_ID not configured" }, req);
      return res.status(500).json({ error: "Authentication configuration error" });
    }
    
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      logSecurityEvent("AUTH_INVALID_TOKEN", { tokenPayload: !!payload }, req);
      return res.status(400).json({ error: "Invalid ID token" });
    }

    const userEmail = payload.email;

    // Domain validation (if enabled)
    if (config.ENFORCE_EMAIL_DOMAIN) {
      const allowedDomain = config.ALLOWED_EMAIL_DOMAIN || "cse.mrt.ac.lk";
      if (!userEmail.endsWith(`@${allowedDomain}`)) {
        logSecurityEvent(
          "AUTH_UNAUTHORIZED_DOMAIN",
          {
            email: userEmail,
            domain: allowedDomain,
          },
          req
        );
        return res.status(403).json({ error: "Unauthorized email domain" });
      }
    }

    // Find users with this email (can be multiple with different roles)
    const users = await authService.findUserByEmail(userEmail);
    if (!users || users.length === 0) {
      logSecurityEvent("AUTH_USER_NOT_FOUND", { email: userEmail }, req);
      return res.status(404).json({ error: "User not found in system" });
    }

    // If multiple roles exist, return available roles for selection
    if (users.length > 1) {
      const availableRoles = await authService.getAvailableRolesForEmail(userEmail);
      logSecurityEvent(
        "AUTH_MULTIPLE_ROLES_FOUND",
        {
          email: userEmail,
          roleCount: users.length,
        },
        req
      );
      return res.status(200).json({
        requiresRoleSelection: true,
        availableRoles,
        email: userEmail,
      });
    }

    // Single role - proceed with login
    const user = users[0];
    if(!user){
        logSecurityEvent("AUTH_USER_NOT_FOUND_SINGLE", { email: userEmail }, req);
        return res.status(404).json({ error: "User not found in system" });
    }

    // Handle first login
    if (user.firstLogin) {
      await authService.handleFirstLogin(user, payload);
      // Invalidate cache since user data changed
      invalidateUserCache(String(user._id));
    }

    // Create session
    if (req.session) {
      (req.session as any).userId = user._id;
      (req.session as any).role = user.role;
      (req.session as any).loginAt = new Date();
      (req.session as any).loginMethod = "google";
    }

    console.log("🔐 Session created:", {
      sessionId: req.sessionID,
      userId: user._id,
      role: user.role,
      cookies: req.headers.cookie ? "present" : "missing",
      origin: req.headers.origin,
    });

    // Force session save and add debugging
    req.session?.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
      } else {
        console.log("✅ Session saved successfully");
        console.log("🍪 Session details:", {
          id: req.sessionID,
          userId: (req.session as any).userId,
          cookie: req.session?.cookie,
        });
      }
    });

    // FORCE session cookie to be sent to browser
    // Use express's cookie signing mechanism
    const signature = crypto
      .createHmac("sha256", config.SESSION_SECRET || "")
      .update(req.sessionID)
      .digest("base64")
      .replace(/=+$/, "");

    const signedSessionId = `s%3A${req.sessionID}.${signature}`;
    const isProduction = process.env.NODE_ENV === "production";
    const sessionCookie = `connect.sid=${signedSessionId}; Path=/; HttpOnly${
      isProduction ? "; Secure" : ""
    }; SameSite=${isProduction ? "None" : "Lax"}; Max-Age=86400`;
    res.setHeader("Set-Cookie", sessionCookie);
    console.log("🔧 Force setting signed session cookie:", sessionCookie);

    // Update last activity
    authService.updateLastActivity(String(user._id));

    logSecurityEvent(
      "AUTH_SUCCESS",
      {
        userId: user._id,
        email: userEmail,
        role: user.role,
      },
      req
    );

    // Return user profile
    const userProfile = await authService.getUserSessionInfo(String(user._id));

    console.log("📤 Sending response with headers:", {
      setCookie: res.getHeaders()["set-cookie"],
      allHeaders: res.getHeaders(),
      sessionId: req.sessionID,
      environment: process.env.NODE_ENV,
      manualCookieSet: res.getHeaders()["set-cookie"] ? "YES" : "NO",
    });

    return res.status(200).json(userProfile);
  } catch (error) {
    logSecurityEvent(
      "AUTH_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.name : "Unknown",
      },
      req
    );

    console.error("Google token verification failed:", error);
    return res.status(401).json({ error: "Token verification failed" });
  }
};

const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  console.log("🔍 getCurrentUser called:", {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: (req.session as any)?.userId,
    cookies: req.headers.cookie ? "present" : "missing",
    origin: req.headers.origin,
  });

  if (!(req.session as any)?.userId) {
    console.log("❌ No session or userId in getCurrentUser");
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const userProfile = await authService.getUserSessionInfo((req.session as any).userId);
    console.log("✅ User profile retrieved:", userProfile.email);

    // Get available roles for role switching
    const availableRoles = await authService.getAvailableRolesForEmail(
      userProfile.email || (req.session as any).email
    );

    // Add session info and available roles
    (userProfile as any).sessionInfo = {
      loginAt: (req.session as any).loginAt,
      lastActivity: (req.session as any).lastActivity,
      requestCount: (req.session as any).requestCount || 0,
    };
    (userProfile as any).availableRoles = availableRoles;

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching current user profile:", error);

    // If user not found, destroy the invalid session
    if (error instanceof Error && error.message === "User not found") {
      req.session?.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserProfile = async (req: Request, res: Response): Promise<Response> => {
  console.log("👤 getUserProfile called:", {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: (req.session as any)?.userId,
    cookies: req.headers.cookie ? "present" : "missing",
    origin: req.headers.origin,
  });

  if (!(req.session as any)?.userId) {
    console.log("❌ No session or userId in getUserProfile");
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const userProfile = await authService.getDetailedUserProfile((req.session as any).userId);
    console.log("✅ Detailed user profile retrieved:", userProfile.email);

    // Get available roles for role switching
    const availableRoles = await authService.getAvailableRolesForEmail(
      userProfile.email || (req.session as any).email
    );
    (userProfile as any).availableRoles = availableRoles;

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);

    // If user not found, destroy the invalid session
    if (error instanceof Error && error.message === "User not found") {
      req.session?.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

const logout = (req: Request, res: Response): void => {
  const userId = (req.session as any)?.userId;
  const sessionId = req.sessionID;

  req.session?.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      // Only send response if headers haven't been sent
      if (!res.headersSent) {
        return res.status(500).json({ error: "Could not log out" });
      }
      return;
    }

    // Clear session cookie (using connect.sid as per app.ts configuration)
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    // Invalidate user cache
    if (userId) {
      invalidateUserCache(userId);
      logSecurityEvent("AUTH_LOGOUT", { userId }, req);
    }

    res.status(200).json({ message: "Logout successful" });
  });
};

// Session management endpoints
const getAllSessions = async (req: Request, res: Response): Promise<Response> => {
  // This would require implementing session enumeration
  // For now, return basic session info
  const sessionInfo = {
    currentSession: {
      id: req.sessionID,
      userId: (req.session as any)?.userId,
      loginAt: (req.session as any)?.loginAt,
      lastActivity: (req.session as any)?.lastActivity,
      requestCount: (req.session as any)?.requestCount || 0,
    },
  };

  return res.json(sessionInfo);
};

const revokeSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  // In a production system, you'd need to implement session revocation
  // This would involve accessing the session store directly

  if (sessionId === req.sessionID) {
    // Revoking current session - redirect to logout
    logout(req, res);
    return;
  }

  // For other sessions, you'd need to implement store-specific revocation
  res.json({ message: "Session revocation not implemented yet" });
};

const selectRole = async (req: Request, res: Response): Promise<Response> => {
  const { id_token, selectedRole } = req.body;

  try {
    // Verify Google token again
    if (!config.GOOGLE_CLIENT_ID) {
      logSecurityEvent("AUTH_CONFIG_ERROR", { error: "GOOGLE_CLIENT_ID not configured" }, req);
      return res.status(500).json({ error: "Authentication configuration error" });
    }
    
    // Verify Google token again
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      logSecurityEvent("AUTH_INVALID_TOKEN", { tokenPayload: !!payload }, req);
      return res.status(400).json({ error: "Invalid ID token" });
    }

    const userEmail = payload.email;

    // Domain validation (if enabled)
    if (config.ENFORCE_EMAIL_DOMAIN) {
      const allowedDomain = config.ALLOWED_EMAIL_DOMAIN || "cse.mrt.ac.lk";
      if (!userEmail.endsWith(`@${allowedDomain}`)) {
        logSecurityEvent(
          "AUTH_UNAUTHORIZED_DOMAIN",
          {
            email: userEmail,
            domain: allowedDomain,
          },
          req
        );
        return res.status(403).json({ error: "Unauthorized email domain" });
      }
    }

    // Find user with specific role
    const user = await authService.findUserByEmailAndRole(userEmail, selectedRole);

    // Handle first login
    if (user.firstLogin) {
      await authService.handleFirstLogin(user, payload);
      // Invalidate cache since user data changed
      invalidateUserCache(user._id.toString());
    }

    // Create session
    if (req.session) {
      (req.session as any).userId = user._id;
      (req.session as any).role = user.role;
      (req.session as any).email = user.email;
      (req.session as any).loginAt = new Date();
      (req.session as any).loginMethod = "google";
    }

    console.log("🔐 Role-specific session created:", {
      sessionId: req.sessionID,
      userId: user._id,
      role: user.role,
      email: user.email,
    });

    // Force session save and add session cookie handling
    req.session?.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
      } else {
        console.log("✅ Session saved successfully");
        console.log("🍪 Session details:", {
          id: req.sessionID,
          userId: (req.session as any).userId,
          cookie: req.session?.cookie,
        });
      }
    });

    // FORCE session cookie to be sent to browser (same as main auth)
    const signature = crypto
      .createHmac("sha256", config.SESSION_SECRET || "")
      .update(req.sessionID)
      .digest("base64")
      .replace(/=+$/, "");

    const signedSessionId = `s%3A${req.sessionID}.${signature}`;
    const isProduction = process.env.NODE_ENV === "production";
    const sessionCookie = `connect.sid=${signedSessionId}; Path=/; HttpOnly${
      isProduction ? "; Secure" : ""
    }; SameSite=${isProduction ? "None" : "Lax"}; Max-Age=86400`;
    res.setHeader("Set-Cookie", sessionCookie);
    console.log("🔧 Force setting signed session cookie for role selection:", sessionCookie);

    // Update last activity
    authService.updateLastActivity(user._id);

    logSecurityEvent(
      "AUTH_ROLE_SELECTED",
      {
        userId: user._id,
        email: userEmail,
        role: user.role,
      },
      req
    );

    // Get available roles for role switching
    const availableRoles = await authService.getAvailableRolesForEmail(userEmail);

    // Return user profile with available roles
    const userProfile = await authService.getUserSessionInfo(user._id);
    (userProfile as any).availableRoles = availableRoles;

    console.log("📤 Sending role selection response with headers:", {
      setCookie: res.getHeaders()["set-cookie"],
      sessionId: req.sessionID,
      userId: user._id,
      role: user.role,
    });

    return res.status(200).json(userProfile);
  } catch (error) {
    logSecurityEvent(
      "AUTH_ROLE_SELECTION_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.name : "Unknown",
      },
      req
    );

    console.error("Role selection failed:", error);
    return res.status(401).json({ error: "Role selection failed" });
  }
};

const switchRole = async (req: Request, res: Response): Promise<Response> => {
  console.log("🔄 switchRole called:", {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    currentUserId: (req.session as any)?.userId,
    currentRole: (req.session as any)?.role,
    email: (req.session as any)?.email,
  });

  if (!(req.session as any)?.userId || !(req.session as any)?.email) {
    console.log("❌ No session or email in switchRole");
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { newRole } = req.body;

  if (!newRole) {
    return res.status(400).json({ error: "New role is required" });
  }

  try {
    // Switch to the new role
    const newUserProfile = await authService.switchUserRole((req.session as any).email, newRole);

    // Update session with new user data
    if (req.session) {
      (req.session as any).userId = newUserProfile.id;
      (req.session as any).role = newRole;
      (req.session as any).lastActivity = new Date();
    }

    // Save session
    req.session?.save((err) => {
      if (err) {
        console.error("❌ Session save error during role switch:", err);
      } else {
        console.log("✅ Session updated with new role");
      }
    });

    // Get available roles for continued switching
    const availableRoles = await authService.getAvailableRolesForEmail((req.session as any).email);
    (newUserProfile as any).availableRoles = availableRoles;

    logSecurityEvent(
      "AUTH_ROLE_SWITCHED",
      {
        oldUserId: (req.session as any).userId,
        newUserId: newUserProfile.id,
        newRole: newRole,
        email: (req.session as any).email,
      },
      req
    );

    console.log("✅ Role switched successfully:", {
      newUserId: newUserProfile.id,
      newRole: newRole,
    });

    return res.status(200).json(newUserProfile);
  } catch (error) {
    console.error("Error switching role:", error);

    logSecurityEvent(
      "AUTH_ROLE_SWITCH_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        requestedRole: newRole,
        email: (req.session as any).email,
      },
      req
    );

    return res.status(500).json({ error: "Role switch failed" });
  }
};

module.exports = {
  googleVerify,
  getCurrentUser,
  getUserProfile,
  selectRole,
  switchRole,
  logout,
  getAllSessions,
  revokeSession,
};
