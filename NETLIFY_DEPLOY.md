# Netlify Deployment Guide

## Quick Deploy Steps:

### 1. Build Command
```
npm run build
```

### 2. Publish Directory
```
dist
```

### 3. Environment Variables (Important!)

Netlify Dashboard में जाकर **Site settings → Environment variables** में add करें:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY = your-key-here
```

**⚠️ Important:** 
- Variable names में `VITE_` prefix जरूरी है
- Values में quotes नहीं लगाने हैं
- Deploy के बाद **Redeploy** करें

## Common Issues & Solutions:

### Issue 1: White Screen
**Solution:** 
- `netlify.toml` file check करें
- `_redirects` file `public/` folder में है या नहीं
- Environment variables set हैं या नहीं

### Issue 2: 404 on Refresh
**Solution:**
- `_redirects` file add करें (already added)
- `netlify.toml` में redirects check करें

### Issue 3: Environment Variables Not Working
**Solution:**
- Netlify Dashboard → Site settings → Environment variables
- Variables add करें
- **Redeploy** करें (important!)

### Issue 4: Build Fails
**Solution:**
- Build logs check करें
- Node version check करें (should be 18+)
- `package.json` में build script verify करें

## Manual Deploy:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Test build:**
   ```bash
   npm run preview
   ```

3. **Deploy to Netlify:**
   - Netlify Dashboard → Sites → Add new site
   - Drag and drop `dist` folder
   - Or connect GitHub repository

## Automatic Deploy (GitHub):

1. Netlify Dashboard → Add new site → Import from Git
2. GitHub repository select करें
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment variables add करें
5. Deploy!

## After Deploy:

1. **Check Console:**
   - Browser DevTools (F12) → Console
   - Errors check करें

2. **Check Network:**
   - DevTools → Network tab
   - Failed requests check करें

3. **Verify Environment Variables:**
   - App में console.log करके check करें
   - या Netlify Functions logs check करें

## Troubleshooting:

### White Screen Fix:
1. `netlify.toml` file exists करती है
2. `public/_redirects` file exists करती है
3. Environment variables set हैं
4. Build successful है
5. Browser console में errors check करें

### Still White Screen?
- Browser console check करें (F12)
- Network tab में failed requests देखें
- Supabase URL और key verify करें

