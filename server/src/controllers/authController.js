const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authService = require('../services/authService');

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id,
            email: user.email,
            role: user.role
        },
        config.JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
    );
};

const googleVerify = async (req, res) => {
    const { id_token } = req.body;
    if (!id_token) {
        return res.status(400).json({ error: 'ID token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: config.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid ID token' });
        }
        console.log('Verified Google Profile:', payload);
        const userEmail = payload.email;

        // Check if the email is from the cse domain
        // const allowedDomain = 'cse.mrt.ac.lk';
        // if (!userEmail || !userEmail.endsWith(`@${allowedDomain}`)) {
        //     console.log('Unauthorized login attempt from:', userEmail);
        //     return res.status(403).json({ error: 'Unauthorized domain' });
        // }

        let user = await authService.findUserByEmail(userEmail);
        if (!user) {
            console.log('User not found:', userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.firstLogin) {
            authService.handleFirstLogin(user, payload);
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return user data with token
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                groupId: user.userGroup,
                profilePicture: user.profilePicture
            },
            token
        });
    } catch (error) {
        console.error('Google token verification failed:', error.message);
        return res.status(401).json({ error: 'Token verification failed' });
    }
};

const getCurrentUser = async (req, res) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({ user: null });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Fetch user from database
        const user = await authService.findUserById(decoded.userId);
        if (!user) {
            return res.status(200).json({ user: null });
        }

        console.log('JWT user:', decoded.userId, 'role:', decoded.role);
        
        const userProfile = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            groupId: user.userGroup,
            profilePicture: user.profilePicture
        }

        return res.status(200).json(userProfile);
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(200).json({ user: null });
        }
        console.error('Error fetching current user profile:', error.message);
        return res.status(500).json({error: 'Internal server error'});
    }
};

const logout = (req, res) => {
    // With JWT, logout is handled on the client by removing the token
    // No server-side session to destroy
    console.log('User logged out successfully');
    return res.status(200).json({ message: 'Logout successful' });
};

module.exports = {
    googleVerify,
    getCurrentUser,
    logout
};