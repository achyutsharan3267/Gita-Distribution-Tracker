# Git Setup Guide

## Step 1: Git Initialize करें

Project folder में terminal खोलें और run करें:

```bash
git init
```

## Step 2: .gitignore Check करें

`.gitignore` file already exists और ये files ignore हो जाएंगी:
- `node_modules/`
- `.env` (important - credentials secure रहेंगे)
- `dist/`
- और अन्य build files

## Step 3: Files Add करें

```bash
# सभी files add करें
git add .

# या specific files add करें
git add src/
git add package.json
git add README.md
```

## Step 4: First Commit करें

```bash
git commit -m "Initial commit: Bhagavad Gita Distribution Tracker"
```

## Step 5: GitHub/GitLab Repository बनाएं

### GitHub पर:
1. GitHub.com पर जाएं
2. New Repository click करें
3. Repository name: `gita-distribution-tracker` (या कोई भी name)
4. Public या Private choose करें
5. **"Initialize with README" को UNCHECK करें** (हमारे पास already है)
6. Create repository

### GitLab पर:
1. GitLab.com पर जाएं
2. New Project → Create blank project
3. Project name दें
4. Create project

## Step 6: Remote Add करें

GitHub/GitLab repository बनाने के बाद, वहां से URL copy करें और run करें:

```bash
# GitHub के लिए
git remote add origin https://github.com/your-username/gita-distribution-tracker.git

# या SSH के लिए
git remote add origin git@github.com:your-username/gita-distribution-tracker.git
```

## Step 7: Push करें

```bash
# Main branch set करें
git branch -M main

# Push करें
git push -u origin main
```

## Important Notes:

### ⚠️ .env File कभी Commit न करें!

`.env` file में sensitive credentials होते हैं:
- Supabase URL
- API Keys

यह file `.gitignore` में है, लेकिन verify करें कि commit नहीं हो रही:

```bash
# Check करें कि .env ignore हो रही है
git status
```

अगर `.env` दिख रही है, तो:
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### 📝 .env.example File

`.env.example` file commit करें (credentials के बिना):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
```

## Complete Commands (Copy-Paste):

```bash
# 1. Initialize
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "Initial commit: Bhagavad Gita Distribution Tracker with authentication and real-time updates"

# 4. Add remote (GitHub URL replace करें)
git remote add origin https://github.com/your-username/gita-distribution-tracker.git

# 5. Push
git branch -M main
git push -u origin main
```

## Future Updates के लिए:

```bash
# Changes check करें
git status

# Changes add करें
git add .

# Commit करें
git commit -m "Description of changes"

# Push करें
git push
```

## Branching (Optional):

```bash
# New branch बनाएं
git checkout -b feature/new-feature

# Changes commit करें
git add .
git commit -m "Add new feature"

# Main branch पर merge करें
git checkout main
git merge feature/new-feature
git push
```

## Troubleshooting:

### "fatal: not a git repository"
- Solution: `git init` run करें

### "Permission denied"
- Solution: SSH keys setup करें या HTTPS use करें

### ".env file commit हो गई"
- Solution: 
  ```bash
  git rm --cached .env
  git commit -m "Remove .env"
  git push
  ```

## Security Checklist:

- [ ] `.env` file `.gitignore` में है
- [ ] `.env` file commit नहीं हुई
- [ ] `.env.example` file commit की है (credentials के बिना)
- [ ] Supabase credentials secure हैं
- [ ] API keys exposed नहीं हैं

