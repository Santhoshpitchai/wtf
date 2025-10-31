# Deployment Guide - WTF (Witness The Fitness)

## 🚀 Deploy to Vercel (Recommended)

Vercel is the recommended platform for Next.js applications and offers the best performance and developer experience.

### Prerequisites
- GitHub account with your repository
- Supabase project with database setup
- Vercel account (free tier available)

---

## Method 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Sign Up/Login to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"

### Step 2: Import Your Repository
1. Click "Add New..." → "Project"
2. Import your GitHub repository: `Santhoshpitchai/wtf`
3. Vercel will automatically detect it's a Next.js project

### Step 3: Configure Environment Variables
Before deploying, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy "anon public" key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Terminal
```bash
cd /Users/santhoshpitchai/Desktop/WTF
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **wtf** (or your preferred name)
- In which directory is your code located? **./**
- Want to override settings? **N**

### Step 4: Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

---

## 🌐 Deploy to Netlify (Alternative)

### Step 1: Sign Up/Login to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub

### Step 2: Import Repository
1. Click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Select your repository: `Santhoshpitchai/wtf`

### Step 3: Configure Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Base directory:** (leave empty)

### Step 4: Add Environment Variables
Go to "Site settings" → "Environment variables" and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Deploy
Click "Deploy site" and wait for the build to complete.

---

## 📋 Post-Deployment Checklist

### 1. Update Supabase Authentication Settings
In your Supabase dashboard:
1. Go to "Authentication" → "URL Configuration"
2. Add your deployment URL to "Site URL"
3. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/dashboard/clients`

### 2. Test Your Deployment
- ✅ Visit your deployed URL
- ✅ Test the splash screen animation
- ✅ Try logging in as Admin
- ✅ Try logging in as PT
- ✅ Test client creation
- ✅ Verify PT filtering works
- ✅ Check sales dashboard

### 3. Set Up Custom Domain (Optional)
**On Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**On Netlify:**
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records

---

## 🔧 Troubleshooting

### Build Fails
**Issue:** Build fails with module errors
**Solution:** 
```bash
# Locally test the build
npm run build

# If successful, commit and push
git add .
git commit -m "fix: build configuration"
git push origin main
```

### Environment Variables Not Working
**Issue:** App can't connect to Supabase
**Solution:**
1. Verify environment variables are set correctly
2. Make sure they start with `NEXT_PUBLIC_`
3. Redeploy after adding variables

### 404 Errors on Routes
**Issue:** Direct URL access shows 404
**Solution:** This shouldn't happen with Next.js on Vercel, but if it does:
- Ensure you're using Next.js 14+ App Router
- Check that all pages are in the `app` directory

### Database Connection Issues
**Issue:** Can't fetch data from Supabase
**Solution:**
1. Check Supabase RLS policies are set correctly
2. Verify API keys in environment variables
3. Check Supabase project is not paused

---

## 🎯 Recommended: Vercel Deployment

**Why Vercel?**
- ✅ Built by Next.js creators
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant rollbacks
- ✅ Preview deployments for PRs
- ✅ Free tier is generous

---

## 📱 Mobile Responsiveness
Your app is already mobile-responsive. Test on:
- Desktop browsers
- Mobile browsers
- Tablet devices

---

## 🔐 Security Notes
- Never commit `.env` files
- Use environment variables for all secrets
- Keep Supabase keys secure
- Enable RLS policies on all tables

---

## 📊 Monitoring
After deployment, monitor:
- Vercel Analytics (built-in)
- Supabase Dashboard for database usage
- Error logs in Vercel dashboard

---

## 🚀 Continuous Deployment
Both Vercel and Netlify support automatic deployments:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Create preview deployments

---

## Need Help?
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

---

**Your app is ready to deploy! 🎉**
