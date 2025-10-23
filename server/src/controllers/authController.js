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

        // Find users with this email (can be multiple with different roles)
        const users = await authService.findUserByEmail(userEmail);
        if (!users || users.length === 0) {
            logSecurityEvent('AUTH_USER_NOT_FOUND', { email: userEmail }, req);
            return res.status(404).json({ error: 'User not found in system' });
        }

        // If multiple roles exist, return available roles for selection
        if (users.length > 1) {
            const availableRoles = await authService.getAvailableRolesForEmail(userEmail);
            logSecurityEvent('AUTH_MULTIPLE_ROLES_FOUND', { 
                email: userEmail,
                roleCount: users.length 
            }, req);
            return res.status(200).json({ 
                requiresRoleSelection: true,
                availableRoles,
                email: userEmail 
            });
        }

        // Single role - proceed with login
        const user = users[0];

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
        
        console.log('🔐 Session created:', {
            sessionId: req.sessionID,
            userId: user._id,
            role: user.role,
            cookies: req.headers.cookie ? 'present' : 'missing',
            origin: req.headers.origin
        });
        
        // Force session save and add debugging
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
            } else {
                console.log('✅ Session saved successfully');
                console.log('🍪 Session details:', {
                    id: req.sessionID,
                    userId: req.session.userId,
                    cookie: req.session.cookie
                });
            }
        });
        
        // FORCE session cookie to be sent to browser
        // Use express's cookie signing mechanism
        const signature = require('crypto')
            .createHmac('sha256', config.SESSION_SECRET)
            .update(req.sessionID)
            .digest('base64')
            .replace(/=+$/, '');
        
        const signedSessionId = `s%3A${req.sessionID}.${signature}`;
        const isProduction = process.env.NODE_ENV === 'production';
        const sessionCookie = `connect.sid=${signedSessionId}; Path=/; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=86400`;
        res.setHeader('Set-Cookie', sessionCookie);
        console.log('🔧 Force setting signed session cookie:', sessionCookie);
        
        // Update last activity
        authService.updateLastActivity(user._id);

        logSecurityEvent('AUTH_SUCCESS', { 
            userId: user._id,
            email: userEmail,
            role: user.role 
        }, req);

        // Return user profile
        const userProfile = await authService.getUserSessionInfo(user._id);
        
        console.log('📤 Sending response with headers:', {
            setCookie: res.getHeaders()['set-cookie'],
            allHeaders: res.getHeaders(),
            sessionId: req.sessionID,
            environment: process.env.NODE_ENV,
            manualCookieSet: res.getHeaders()['set-cookie'] ? 'YES' : 'NO'
        });
        
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
    console.log('🔍 getCurrentUser called:', {
        hasSession: !!req.session,
        sessionId: req.session?.id,
        userId: req.session?.userId,
        cookies: req.headers.cookie ? 'present' : 'missing',
        origin: req.headers.origin
    });

    if (!req.session?.userId) {
        console.log('❌ No session or userId in getCurrentUser');
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const userProfile = await authService.getUserSessionInfo(req.session.userId);
        console.log('✅ User profile retrieved:', userProfile.email);
        
        // Get available roles for role switching
        const availableRoles = await authService.getAvailableRolesForEmail(userProfile.email || req.session.email);
        
        // Add session info and available roles
        userProfile.sessionInfo = {
            loginAt: req.session.loginAt,
            lastActivity: req.session.lastActivity,
            requestCount: req.session.requestCount || 0
        };
        userProfile.availableRoles = availableRoles;

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

const getUserProfile = async (req, res) => {
    console.log('👤 getUserProfile called:', {
        hasSession: !!req.session,
        sessionId: req.session?.id,
        userId: req.session?.userId,
        cookies: req.headers.cookie ? 'present' : 'missing',
        origin: req.headers.origin
    });

    if (!req.session?.userId) {
        console.log('❌ No session or userId in getUserProfile');
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const userProfile = await authService.getDetailedUserProfile(req.session.userId);
        console.log('✅ Detailed user profile retrieved:', userProfile.email);
        
        // Get available roles for role switching
        const availableRoles = await authService.getAvailableRolesForEmail(userProfile.email || req.session.email);
        userProfile.availableRoles = availableRoles;
        
        return res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        
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

const selectRole = async (req, res) => {
    const { id_token, selectedRole } = req.body;
    
    if (!id_token || !selectedRole) {
        logSecurityEvent('AUTH_MISSING_ROLE_SELECTION', {}, req);
        return res.status(400).json({ error: 'ID token and selected role are required' });
    }

    try {
        // Verify Google token again
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

        // Find user with specific role
        const user = await authService.findUserByEmailAndRole(userEmail, selectedRole);
        
        // Handle first login
        if (user.firstLogin) {
            await authService.handleFirstLogin(user, payload);
            // Invalidate cache since user data changed
            invalidateUserCache(user._id);
        }

        // Create session
        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.email = user.email;
        req.session.loginAt = new Date();
        req.session.loginMethod = 'google';
        
        console.log('🔐 Role-specific session created:', {
            sessionId: req.sessionID,
            userId: user._id,
            role: user.role,
            email: user.email
        });
        
        // Force session save and add session cookie handling
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
            } else {
                console.log('✅ Session saved successfully');
                console.log('🍪 Session details:', {
                    id: req.sessionID,
                    userId: req.session.userId,
                    cookie: req.session.cookie
                });
            }
        });
        
        // FORCE session cookie to be sent to browser (same as main auth)
        const signature = require('crypto')
            .createHmac('sha256', config.SESSION_SECRET)
            .update(req.sessionID)
            .digest('base64')
            .replace(/=+$/, '');
        
        const signedSessionId = `s%3A${req.sessionID}.${signature}`;
        const isProduction = process.env.NODE_ENV === 'production';
        const sessionCookie = `connect.sid=${signedSessionId}; Path=/; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=86400`;
        res.setHeader('Set-Cookie', sessionCookie);
        console.log('🔧 Force setting signed session cookie for role selection:', sessionCookie);
        
        // Update last activity
        authService.updateLastActivity(user._id);

        logSecurityEvent('AUTH_ROLE_SELECTED', { 
            userId: user._id,
            email: userEmail,
            role: user.role 
        }, req);

        // Get available roles for role switching
        const availableRoles = await authService.getAvailableRolesForEmail(userEmail);
        
        // Return user profile with available roles
        const userProfile = await authService.getUserSessionInfo(user._id);
        userProfile.availableRoles = availableRoles;
        
        console.log('📤 Sending role selection response with headers:', {
            setCookie: res.getHeaders()['set-cookie'],
            sessionId: req.sessionID,
            userId: user._id,
            role: user.role
        });
        
        return res.status(200).json(userProfile);

    } catch (error) {
        logSecurityEvent('AUTH_ROLE_SELECTION_ERROR', { 
            error: error.message,
            type: error.name 
        }, req);
        
        console.error('Role selection failed:', error);
        return res.status(401).json({ error: 'Role selection failed' });
    }
};

const switchRole = async (req, res) => {
    console.log('🔄 switchRole called:', {
        hasSession: !!req.session,
        sessionId: req.session?.id,
        currentUserId: req.session?.userId,
        currentRole: req.session?.role,
        email: req.session?.email
    });

    if (!req.session?.userId || !req.session?.email) {
        console.log('❌ No session or email in switchRole');
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { newRole } = req.body;
    
    if (!newRole) {
        return res.status(400).json({ error: 'New role is required' });
    }

    try {
        // Switch to the new role
        const newUserProfile = await authService.switchUserRole(req.session.email, newRole);
        
        // Update session with new user data
        req.session.userId = newUserProfile.id;
        req.session.role = newRole;
        req.session.lastActivity = new Date();
        
        // Save session
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error during role switch:', err);
            } else {
                console.log('✅ Session updated with new role');
            }
        });

        // Get available roles for continued switching
        const availableRoles = await authService.getAvailableRolesForEmail(req.session.email);
        newUserProfile.availableRoles = availableRoles;

        logSecurityEvent('AUTH_ROLE_SWITCHED', { 
            oldUserId: req.session.userId,
            newUserId: newUserProfile.id,
            newRole: newRole,
            email: req.session.email
        }, req);
        
        console.log('✅ Role switched successfully:', {
            newUserId: newUserProfile.id,
            newRole: newRole
        });
        
        return res.status(200).json(newUserProfile);
    } catch (error) {
        console.error('Error switching role:', error);
        
        logSecurityEvent('AUTH_ROLE_SWITCH_ERROR', { 
            error: error.message,
            requestedRole: newRole,
            email: req.session.email
        }, req);
        
        return res.status(500).json({ error: 'Role switch failed' });
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
    revokeSession
};