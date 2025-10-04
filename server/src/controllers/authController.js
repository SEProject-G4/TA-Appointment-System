const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const authService = require('../services/authService');

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);


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

        req.session.userId = user._id;
        req.session.role = user.role;

        return res.status(200).json(user);
    } catch (error) {
        console.error('Google token verification failed:', error.message);
        return res.status(401).json({ error: 'Token verification failed' });
    }
};

const getCurrentUser = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({error: 'User not authenticated'});
    }

    try {
        const user = await authService.findUserById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.status(404).json({error: 'User not found'});
        }

        console.log('Session user:', req.session.userId, 'role:', req.session.role);
        
        const userProfile = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
<<<<<<< HEAD
            groupID: user.userGroup ,
=======
            groupId: user.userGroup,
>>>>>>> 6802bff420d23842886ef87e6370bbe69d051693
            profilePicture: user.profilePicture
        }

        return res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching current user profile:', error.message);
        return res.status(500).json({error: 'Internal server error'});
    }
};

const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({error: 'Could not log out'});
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logout successful' });
    });
    console.log('User logged out successfully');
};

module.exports = {
    googleVerify,
    getCurrentUser,
    logout
};