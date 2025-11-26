# Production Deployment Guide

## Overview

When you deploy to production, you'll have a permanent URL (like `https://wtffitness.com` or `https://your-app.vercel.app`), so you won't need ngrok or local IP addresses anymore.

## Recommended: Deploy to Vercel (Easiest for Next.js)

Vercel is made by the creators of Next.js and is the easiest deployment option.

### Why Vercel?

- ✅ **Free tier** - Perfect for getting started
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Permanent URL** - Never changes
- ✅ **Easy deployment** - One command
- ✅ **Automatic builds** - Deploy on git push
- ✅ **Environment variables** - Easy to manage
- ✅ **Perfect for Next.js** - Built by the same team

---

## Step-by-Step: Vercel Deployment

### Step 1: Prepare Your Code

Make sure your code is in a Git repository:

```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (recommended)
# Create a repo on GitHub first, then:
git remote add origin https://github.com/yourusername/wtf-fitness.git
git push -u origin main
```

### Step 2: Sign Up for Vercel

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub (recommended - easiest integration)
3. It's free!

### Step 3: Import Your Project

**Option A: Via Vercel Dashboard (Easiest)**

1. Click "Add New Project"
2. Import your GitHub repository
3. Vercel will auto-detect it's a Next.js app
4. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **wtf-fitness** (or your choice)
- Directory? **./** (press Enter)
- Override settings? **No**

### Step 4: Add Environment Variables

After deployment, add your environment variables:

**Via Vercel Dashboard:**

1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prwvplpsdiuyslnojnei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Choose one)
# Option 1: Gmail SMTP
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Option 2: Resend (if you verified your domain)
# RESEND_API_KEY=your_resend_key
# RESEND_FROM_EMAIL=WTF Fitness <noreply@yourdomain.com>

# App URL (IMPORTANT!)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important:** For `NEXT_PUBLIC_APP_URL`, use your actual Vercel URL!

**Via Vercel CLI:**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add NEXT_PUBLIC_APP_URL
```

### Step 5: Redeploy

After adding environment variables:

**Via Dashboard:**
- Go to "Deployments"
- Click "..." on latest deployment
- Click "Redeploy"

**Via CLI:**
```bash
vercel --prod
```

### Step 6: Get Your Production URL

Vercel will give you a URL like:
- `https://wtf-fitness.vercel.app`
- Or `https://wtf-fitness-abc123.vercel.app`

### Step 7: Update NEXT_PUBLIC_APP_URL

**Important:** Make sure `NEXT_PUBLIC_APP_URL` matches your Vercel URL!

1. Go to Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
3. Redeploy

### Step 8: Test!

1. Visit your Vercel URL
2. Log in as a PT
3. Go to Start Session
4. Click START on a client
5. Check the client's email (on any device!)
6. Click verification link
7. Should work perfectly! ✅

---

## Custom Domain (Optional)

Want to use your own domain like `wtffitness.com`?

### Step 1: Buy a Domain

Buy from:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

### Step 2: Add Domain to Vercel

1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `wtffitness.com`)
4. Vercel will show you DNS records to add

### Step 3: Update DNS

Add the DNS records Vercel provides to your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 4: Wait for DNS Propagation

- Usually takes 5-30 minutes
- Sometimes up to 24 hours
- Vercel will show "Valid Configuration" when ready

### Step 5: Update Environment Variable

Update `NEXT_PUBLIC_APP_URL`:

```bash
NEXT_PUBLIC_APP_URL=https://wtffitness.com
```

Redeploy!

---

## Alternative: Deploy to Netlify

Another great option for Next.js apps.

### Quick Steps:

1. Sign up at [https://netlify.com](https://netlify.com)
2. Connect your GitHub repo
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables
5. Deploy!

---

## Alternative: Deploy to Your Own Server

If you have your own server (VPS, AWS EC2, etc.):

### Requirements:
- Node.js 18+ installed
- Domain pointing to your server
- SSL certificate (use Let's Encrypt)

### Quick Steps:

```bash
# On your server
git clone your-repo
cd wtf-fitness
npm install
npm run build

# Create .env.production
nano .env.production
# Add all your environment variables

# Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "wtf-fitness" -- start
pm2 save
pm2 startup
```

### Set up Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then set up SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables for Production

### Required Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (CRITICAL!)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Email Service (Choose one)
# Gmail SMTP (works for production too!)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# OR Resend (recommended for production)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=WTF Fitness <noreply@yourdomain.com>
```

### Important Notes:

1. **NEXT_PUBLIC_APP_URL** - Must match your production domain exactly!
2. **Email Service** - Gmail works fine for production (up to 500 emails/day)
3. **Service Role Key** - Keep this secret! Never expose in client code
4. **HTTPS** - Always use HTTPS in production (Vercel does this automatically)

---

## Email Service for Production

### Option 1: Keep Gmail SMTP

Gmail works fine for production if you're sending less than 500 emails/day:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

**Pros:**
- ✅ Free
- ✅ Easy
- ✅ Already set up
- ✅ 500 emails/day

**Cons:**
- ❌ Limited to 500/day
- ❌ Emails from Gmail address

### Option 2: Switch to Resend with Verified Domain

For a more professional setup:

1. Verify your domain in Resend
2. Update environment variables:

```bash
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=WTF Fitness <noreply@yourdomain.com>
```

**Pros:**
- ✅ Professional sender address
- ✅ Better deliverability
- ✅ Higher limits
- ✅ Better for scaling

**Cons:**
- ❌ Requires domain verification
- ❌ Costs money at scale

### Option 3: SendGrid

100 emails/day free forever:

```bash
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_SERVICE=sendgrid
```

---

## Deployment Checklist

### Before Deploying:

- [ ] Code is in Git repository
- [ ] All environment variables documented
- [ ] Tested locally with production-like settings
- [ ] Database is accessible from internet (Supabase ✓)
- [ ] Email service configured

### During Deployment:

- [ ] Deployed to Vercel/Netlify/Server
- [ ] Added all environment variables
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Redeployed after adding env variables

### After Deployment:

- [ ] Visited production URL - app loads
- [ ] Can log in
- [ ] Can create/view clients
- [ ] Can start session
- [ ] Verification email sent
- [ ] Email received on phone
- [ ] Verification link works
- [ ] Session starts successfully

---

## Troubleshooting Production

### Verification links still show localhost

**Problem:** `NEXT_PUBLIC_APP_URL` not set correctly

**Solution:**
1. Check environment variables in Vercel/Netlify
2. Make sure `NEXT_PUBLIC_APP_URL=https://your-production-domain.com`
3. Redeploy

### Emails not sending

**Problem:** Email service credentials not set

**Solution:**
1. Check environment variables
2. Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
3. Or `RESEND_API_KEY` if using Resend
4. Redeploy

### Database connection errors

**Problem:** Supabase credentials not set

**Solution:**
1. Add `NEXT_PUBLIC_SUPABASE_URL`
2. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy

### Build fails

**Problem:** Missing dependencies or build errors

**Solution:**
1. Check build logs in Vercel/Netlify
2. Make sure all dependencies are in `package.json`
3. Test build locally: `npm run build`
4. Fix errors and redeploy

---

## Cost Breakdown

### Free Tier (Perfect for Starting):

- **Vercel**: Free (100GB bandwidth, unlimited deployments)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Gmail SMTP**: Free (500 emails/day)
- **Total**: $0/month ✅

### Paid Tier (For Growth):

- **Vercel Pro**: $20/month (1TB bandwidth, better performance)
- **Supabase Pro**: $25/month (8GB database, 50GB bandwidth)
- **SendGrid**: $19.95/month (50k emails)
- **Custom Domain**: $10-15/year
- **Total**: ~$65/month

---

## Recommended Setup

### For Testing/MVP:
- **Hosting**: Vercel (free)
- **Database**: Supabase (free)
- **Email**: Gmail SMTP (free)
- **Domain**: Use Vercel subdomain (free)
- **Total**: $0/month

### For Production:
- **Hosting**: Vercel Pro ($20/mo)
- **Database**: Supabase Pro ($25/mo)
- **Email**: SendGrid ($20/mo) or Resend
- **Domain**: Your own domain ($10/year)
- **Total**: ~$65/month

---

## Quick Deploy Commands

### Vercel:
```bash
# Install CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Check Deployment:
```bash
# View deployments
vercel ls

# View logs
vercel logs
```

---

## Next Steps After Deployment

1. **Test thoroughly** - Test all features in production
2. **Monitor** - Set up error tracking (Sentry, LogRocket)
3. **Analytics** - Add Google Analytics or similar
4. **Backup** - Supabase has automatic backups
5. **Scale** - Upgrade plans as you grow

---

**You're ready to deploy!** 🚀

Choose Vercel for the easiest deployment experience, or use any other platform you prefer. The key is setting `NEXT_PUBLIC_APP_URL` to your production domain!
