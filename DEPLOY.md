# Frontend Deployment to Render

## Prerequisites  
- GitHub repository with frontend code
- Render account (free tier)
- Backend API already deployed

## Quick Deploy

### 1. Deploy Frontend as Static Site
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - **Name**: `medical-camp-frontend`
   - **Root Directory**: Leave blank (since this is now the root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

5. Click "Create Static Site"

## Environment Variables

```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Build Process

The build process will:
1. Install all npm dependencies
2. Run TypeScript compilation
3. Build optimized bundle with Vite
4. Generate static files in `dist/` directory
5. Deploy to Render's CDN

## Testing Deployment

1. **Access Frontend**: `https://your-frontend-url.onrender.com`
2. **Test Registration**: Try accessing `https://your-frontend-url.onrender.com/test-camp`
3. **API Connection**: Check browser console for API call success

## Notes for Free Tier

- Static sites don't have cold start issues (always fast)
- 100GB bandwidth per month
- Global CDN for fast loading
- Automatic SSL certificate
- GitHub integration for auto-deploys on push

## Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs for TypeScript errors or missing dependencies
2. **API Connection**: Verify `VITE_API_URL` points to correct backend URL
3. **Routing**: Single Page App routing handled by Render automatically
4. **CORS Issues**: Ensure backend allows your frontend domain in CORS settings

### Debug Checklist
- [ ] Environment variable `VITE_API_URL` is set correctly
- [ ] Backend is deployed and accessible
- [ ] No TypeScript compilation errors
- [ ] All dependencies in package.json are resolvable

## Custom Domain (Optional)

1. Go to your static site settings in Render
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## Performance Optimization

- Render automatically serves from global CDN
- Gzip compression enabled by default  
- Assets are cached with optimal headers
- Consider image optimization for better loading times

## Production Considerations

- Monitor usage in Render dashboard
- Set up error tracking (Sentry, etc.)
- Consider adding a service worker for offline capabilities
- Implement analytics if needed (Google Analytics, etc.)