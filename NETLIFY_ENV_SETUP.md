# Netlify Environment Variables Setup

## Problem:
```
❌ Supabase credentials not found!
URL: MISSING
Key: MISSING
```

## Solution: Set Environment Variables in Netlify

### Step 1: Netlify Dashboard में जाएं

1. https://app.netlify.com पर login करें
2. आपका site select करें: **gitadistribution**
3. **Site settings** click करें (left sidebar में)

### Step 2: Environment Variables Add करें

1. **Environment variables** section में जाएं
2. **Add a variable** button click करें
3. दो variables add करें:

#### Variable 1:
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://your-project-id.supabase.co`
- **Scopes:** All scopes (Production, Deploy previews, Branch deploys)

#### Variable 2:
- **Key:** `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Value:** `your-publishable-key-here`
- **Scopes:** All scopes

### Step 3: Supabase Credentials कहाँ से लें

1. Supabase Dashboard: https://app.supabase.com
2. आपका project select करें
3. **Settings** → **API** में जाएं
4. Copy करें:
   - **Project URL** → `VITE_SUPABASE_URL` में paste करें
   - **publishable key** → `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` में paste करें

### Step 4: Redeploy करें

**Important:** Environment variables add करने के बाद **Redeploy** जरूरी है!

1. Netlify Dashboard → **Deploys** tab
2. **Trigger deploy** → **Clear cache and deploy site** click करें
3. Wait for deploy to complete (2-3 minutes)

### Step 5: Verify

1. Site खोलें: https://gitadistribution.netlify.app/
2. Browser Console (F12) check करें
3. अब ये message दिखना चाहिए:
   ```
   ✅ Supabase configured
   ```

## Quick Checklist:

- [ ] Netlify Dashboard में logged in हैं
- [ ] Site settings → Environment variables में गए हैं
- [ ] `VITE_SUPABASE_URL` add किया है
- [ ] `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` add किया है
- [ ] Supabase credentials correct हैं
- [ ] **Redeploy** किया है (important!)
- [ ] Site check किया है

## Common Mistakes:

❌ **Variable name wrong:**
- Wrong: `SUPABASE_URL`
- Correct: `VITE_SUPABASE_URL` (VITE_ prefix जरूरी है!)

❌ **Redeploy नहीं किया:**
- Environment variables add करने के बाद **Redeploy** जरूरी है
- Old build में variables नहीं होंगे

❌ **Wrong values:**
- URL में `https://` include करें
- Key में spaces नहीं होने चाहिए

## Still Not Working?

1. **Check Build Logs:**
   - Netlify → Deploys → Latest deploy → Build log
   - Environment variables inject हो रहे हैं या नहीं check करें

2. **Check Browser Console:**
   - F12 → Console tab
   - Exact error message देखें

3. **Verify Variables:**
   - Netlify → Site settings → Environment variables
   - Variables list में verify करें

## After Setup:

अगर सब कुछ सही है, तो:
- White screen disappear हो जाएगी
- App properly load होगी
- Supabase connection work करेगा

