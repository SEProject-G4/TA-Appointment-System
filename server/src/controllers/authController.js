const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const authService = require('../services/authService');
const { invalidateUserCache } = require('../middleware/authMiddleware');

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Enhanced security logging
const logSecurityEvent = (type, details, req) => {
    const logData = {
        type,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        ...details
    };
    
    console.log(`SECURITY EVENT [${type}]:`, JSON.stringify(logData));
    
    // In production, you might want to send this to a security monitoring service
    // securityMonitoring.log(logData);
};

const googleVerify = async (req, res) => {
    const { id_token } = req.body;
    
    if (!id_token) {
        logSecurityEvent('AUTH_MISSING_TOKEN', {}, req);
        return res.status(400).json({ error: 'ID token is required' });
    }

    try {
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: config.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            logSecurityEvent('AUTH_INVALID_TOKEN', { tokenPayload: !!payload }, req);
            return res.status(400).json({ error: 'Invalid ID token' });
        }

        const userEmail = payload.email;
        
        // Domain validation (if enabled)
        if (config.ENFORCE_EMAIL_DOMAIN) {
            const allowedDomain = config.ALLOWED_EMAIL_DOMAIN || 'cse.mrt.ac.lk';
            if (!userEmail.endsWith(`@${allowedDomain}`)) {
                logSecurityEvent('AUTH_UNAUTHORIZED_DOMAIN', { 
                    email: userEmail,
                    domain: allowedDomain 
                }, req);
                return res.status(403).json({ error: 'Unauthorized email domain' });
            }
        }

        // Find all users with this email (for multi-role support)
        const allUsers = await authService.findAllUsersByEmail(userEmail);
        if (!allUsers || allUsers.length === 0) {
            logSecurityEvent('AUTH_USER_NOT_FOUND', { email: userEmail }, req);
            return res.status(404).json({ error: 'User not found in system' });
        }

        // If user has multiple roles, restrict selection to admin/lecturer only
        if (allUsers.length > 1) {
            const adminLecturerUsers = allUsers.filter(u => u.role === 'admin' || u.role === 'lecturer');

            if (adminLecturerUsers.length > 1) {
                const availableRoles = adminLecturerUsers.map(u => ({
                    userId: u._id,
                    role: u.role,
                    groupId: u.userGroup,
                    firstLogin: u.firstLogin
                }));

                // Store email in session temporarily for role selection
                req.session.pendingEmail = userEmail;
                req.session.googlePayload = payload;
                
                logSecurityEvent('AUTH_MULTI_ROLE_DETECTED', { 
                    email: userEmail,
                    roles: availableRoles.map(r => r.role)
                }, req);

                return res.status(200).json({
                    requiresRoleSelection: true,
                    availableRoles: availableRoles,
                    email: userEmail
                });
            }

            // If only one of admin/lecturer exists, fall through and log in to that one
            if (adminLecturerUsers.length === 1) {
                allUsers.splice(0, allUsers.length, adminLecturerUsers[0]);
            }
        }

        // Single role (or only one of admin/lecturer) - proceed with normal login
        const user = allUsers[0];

        // Handle first login
        if (user.firstLogin) {
            await authService.handleFirstLogin(user, payload);
            // Invalidate cache since user data changed
            invalidateUserCache(user._id);
        }

        // Create session
        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.loginAt = new Date();
        req.session.loginMethod = 'google';
        
        // Clear any pending data
        delete req.session.pendingEmail;
        delete req.session.googlePayload;
        
        // Update last activity
        authService.updateLastActivity(user._id);

        logSecurityEvent('AUTH_SUCCESS', { 
            userId: user._id,
            email: userEmail,
            role: user.role 
        }, req);

        // Return user profile
        const userProfile = await authService.getUserSessionInfo(user._id);
        return res.status(200).json(userProfile);

    } catch (error) {
        logSecurityEvent('AUTH_ERROR', { 
            error: error.message,
            type: error.name 
        }, req);
        
        console.error('Google token verification failed:', error);
        return res.status(401).json({ error: 'Token verification failed' });
    }
};

const getCurrentUser = async (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const userProfile = await authService.getUserSessionInfo(req.session.userId);
        
        // Add session info
        userProfile.sessionInfo = {
            loginAt: req.session.loginAt,
            lastActivity: req.session.lastActivity,
            requestCount: req.session.requestCount || 0
        };

        return res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching current user profile:', error);
        
        // If user not found, destroy the invalid session
        if (error.message === 'User not found') {
            req.session.destroy((err) => {
                if (err) console.error('Session destroy error:', err);
            });
            return res.status(404).json({ error: 'User not found' });
        }
        
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const selectRole = async (req, res) => {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
    }

    // Check if there's a pending authentication
    if (!req.session.pendingEmail || !req.session.googlePayload) {
        logSecurityEvent('AUTH_ROLE_SELECT_NO_PENDING', { userId, role }, req);
        return res.status(400).json({ error: 'No pending authentication found. Please login again.' });
    }

    try {
        // Verify the user exists with this email and role
        const user = await authService.findUserByEmailAndRole(req.session.pendingEmail, role);
        
        if (!user || user._id.toString() !== userId) {
            logSecurityEvent('AUTH_ROLE_SELECT_INVALID', { 
                userId, 
                role,
                email: req.session.pendingEmail 
            }, req);
            return res.status(403).json({ error: 'Invalid role selection' });
        }

        // Handle first login
        if (user.firstLogin) {
            await authService.handleFirstLogin(user, req.session.googlePayload);
            invalidateUserCache(user._id);
        }

        // Create session with selected role
        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.loginAt = new Date();
        req.session.loginMethod = 'google';
        
        // Clear pending data
        const pendingEmail = req.session.pendingEmail;
        delete req.session.pendingEmail;
        delete req.session.googlePayload;
        
        // Update last activity
        authService.updateLastActivity(user._id);

        logSecurityEvent('AUTH_ROLE_SELECTED', { 
            userId: user._id,
            email: pendingEmail,
            role: user.role 
        }, req);

        // Return user profile
        const userProfile = await authService.getUserSessionInfo(user._id);
        return res.status(200).json(userProfile);

    } catch (error) {
        logSecurityEvent('AUTH_ROLE_SELECT_ERROR', { 
            error: error.message,
            userId,
            role 
        }, req);
        
        console.error('Role selection failed:', error);
        return res.status(500).json({ error: 'Role selection failed' });
    }
};

const logout = (req, res) => {
    const userId = req.session?.userId;
    const sessionId = req.sessionID;
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        
        // Clear session cookie
        res.clearCookie('ta.session.id', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        });
        
        // Invalidate user cache
        if (userId) {
            invalidateUserCache(userId);
            logSecurityEvent('AUTH_LOGOUT', { userId }, req);
        }
        
        return res.status(200).json({ message: 'Logout successful' });
    });
};

// Session management endpoints
const getAllSessions = async (req, res) => {
    // This would require implementing session enumeration
    // For now, return basic session info
    const sessionInfo = {
        currentSession: {
            id: req.sessionID,
            userId: req.session?.userId,
            loginAt: req.session?.loginAt,
            lastActivity: req.session?.lastActivity,
            requestCount: req.session?.requestCount || 0
        }
    };
    
    res.json(sessionInfo);
};

const revokeSession = async (req, res) => {
    const { sessionId } = req.params;
    
    // In a production system, you'd need to implement session revocation
    // This would involve accessing the session store directly
    
    if (sessionId === req.sessionID) {
        // Revoking current session - redirect to logout
        return logout(req, res);
    }
    
    // For other sessions, you'd need to implement store-specific revocation
    res.json({ message: 'Session revocation not implemented yet' });
};

module.exports = {
    googleVerify,
    selectRole,
    getCurrentUser,
    logout,
    getAllSessions,
    revokeSession
};