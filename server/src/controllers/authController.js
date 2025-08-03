const axios = require('axios');
const config = require('../config');
const authService = require('../services/authService');

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const googleLogin = (req, res) => {
    const queryParams = new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        redirect_uri: `${config.BACKEND_URL}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
    }).toString();

    return res.redirect(`${GOOGLE_OAUTH_URL}?${queryParams}`);
};

const googleCallback = async (req, res) => {
    const {code, error} = req.query;

    if(error){
        console.error('Google OAuth error:', error);
        return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_error`);
    }
    if (!code){
        return res.redirect(`${config.FRONTEND_URL}/login?error=missing_code`);
    }

    try{
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, null, {
            params: {
                code,
                client_id: config.GOOGLE_CLIENT_ID,
                client_secret: config.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${config.BACKEND_URL}/api/auth/google/callback`,
                grant_type: 'authorization_code'
            },
        });

        const {access_token} = tokenResponse.data;

        const userInfoResponse = await axios.get(GOOGLE_USER_INFO_URL, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const googleProfile = userInfoResponse.data;
        //console.log('Google Profile:', googleProfile);
        const userEmail = googleProfile.email;
        

        // Check if the email is from the cse domain
        const allowedDomain = 'cse.mrt.ac.lk';
        if(!userEmail || !userEmail.endsWith(`@${allowedDomain}`)) {
            console.log('Unauthorised login attempt from:', userEmail);
            return res.redirect(`${config.FRONTEND_URL}/login?error=unauthorized_domain`);
        }

        let user = await authService.findUser(googleProfile);
        if (!user) {
            return res.redirect(`${config.FRONTEND_URL}/login?error=unauthorized_cse_user`);
        }

        req.session.userId = user._id;
        req.session.role = user.role;

        return res.redirect(`${config.FRONTEND_URL}/admin-dashboard`);
    }catch(error){
        console.error('Google authentication error:', error.message);
        return res.redirect(`${config.FRONTEND_URL}/login?error=auth_failed`);
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
        
        const userProfile = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
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
        return res.redirect(`${config.FRONTEND_URL}/login`);
    });
};

module.exports = {
    googleLogin,
    googleCallback,
    getCurrentUser,
    logout
};