# Vercel Deployment Guide for TA Appointment System

## Prerequisites
- Vercel account (free tier is sufficient)
- GitHub repository connected to Vercel
- Backend server deployed (Railway, Heroku, or similar)

## Environment Variables Setup

### Required Environment Variables in Vercel Dashboard:

1. **VITE_BACKEND_URL**
   - Value: Your deployed backend URL (e.g., `https://your-backend.railway.app/api`)
   - Description: Backend API endpoint

2. **VITE_GOOGLE_CLIENT_ID**
   - Value: `507173497561-djreevqpqmc34gk6bjk3pjs0svnu577b.apps.googleusercontent.com`
   - Description: Google OAuth Client ID

### Setting Environment Variables:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the variables above for all environments (Production, Preview, Development)

## Google OAuth Configuration

### Update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add authorized JavaScript origins:
   - `https://your-vercel-app.vercel.app`
   - `https://your-custom-domain.com` (if using custom domain)
4. Add authorized redirect URIs:
   - `https://your-vercel-app.vercel.app`
   - `https://your-vercel-app.vercel.app/login`

## Deployment Steps

### Automatic Deployment (Recommended):

1. Connect your GitHub repository to Vercel
2. Import the project
3. Set root directory to `client`
4. Configure environment variables
5. Deploy

### Manual Deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to client directory
cd client

# Deploy
vercel --prod
```

## Configuration Details

### vercel.json Features:

- **SPA Routing**: All routes redirect to index.html for client-side routing
- **Asset Caching**: Static assets cached for 1 year
- **Security Headers**: XSS protection, content type validation, frame options
- **Build Configuration**: Optimized for Vite builds
- **Performance**: CDN distribution and compression

### Post-Deployment Checklist:

1. ✅ Test Google OAuth login
2. ✅ Verify API connections to backend
3. ✅ Check all routes work properly
4. ✅ Test responsive design
5. ✅ Verify HTTPS certificate
6. ✅ Check browser console for errors

## Custom Domain (Optional)

1. Purchase domain from registrar
2. Add domain in Vercel dashboard
3. Update DNS records as instructed
4. Update Google OAuth settings with new domain

## Troubleshooting

### Common Issues:

1. **OAuth errors**: Check authorized origins in Google Cloud Console
2. **API connection failed**: Verify VITE_BACKEND_URL environment variable
3. **404 on refresh**: Ensure SPA routing is configured (handled by vercel.json)
4. **Build failures**: Check TypeScript errors and dependencies

### Environment Variable Testing:

```javascript
// Add to any component for debugging
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

## Performance Optimizations

The vercel.json includes:

- Asset caching strategies
- Security headers
- CDN optimization
- Compression settings
- Regional deployment preferences

## Security Features

- Content Security Policy headers
- XSS protection
- Frame options for clickjacking prevention
- Strict referrer policy
- Permissions policy restrictions