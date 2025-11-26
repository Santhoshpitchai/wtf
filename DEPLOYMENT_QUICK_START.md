# Quick Start: Deploy to Production

## TL;DR

When you deploy, you'll have a permanent URL and won't need ngrok anymore!

## Easiest Option: Vercel (5 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git push
```

### 2. Deploy to Vercel

1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

Done! You'll get a URL like: `https://wtf-fitness.vercel.app`

### 3. Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
NEXT_PUBLIC_APP_URL=https://wtf-fitness.vercel.app
```

**Important:** Use YOUR Vercel URL for `NEXT_PUBLIC_APP_URL`!

### 4. Redeploy

Click "Redeploy" in Vercel dashboard.

### 5. Test!

- Visit your Vercel URL
- Send verification email
- Open on phone (anywhere!)
- Click link
- Works! ✅

## Key Differences: Development vs Production

### Development (ngrok):
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io  # Changes every restart
```

### Production (Vercel):
```bash
NEXT_PUBLIC_APP_URL=https://wtf-fitness.vercel.app  # Permanent!
```

## Benefits of Production Deployment

- ✅ **Permanent URL** - Never changes
- ✅ **No ngrok needed** - No more updating URLs
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Works everywhere** - Any device, any location
- ✅ **Professional** - Real domain
- ✅ **Free tier** - Perfect for starting

## Cost

### Free Tier (Perfect for MVP):
- Vercel: Free
- Supabase: Free
- Gmail SMTP: Free
- **Total: $0/month** ✅

### With Custom Domain:
- Domain: $10-15/year
- Everything else: Free
- **Total: ~$1/month**

## Custom Domain (Optional)

Want `wtffitness.com` instead of `wtf-fitness.vercel.app`?

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Add to Vercel (Settings → Domains)
3. Update DNS records
4. Update `NEXT_PUBLIC_APP_URL=https://wtffitness.com`
5. Done!

## Email Service for Production

### Option 1: Keep Gmail (Easiest)
- Already set up ✅
- Free ✅
- 500 emails/day ✅
- Works great for production!

### Option 2: Upgrade to SendGrid/Resend
- More professional
- Higher limits
- Better deliverability
- See `PRODUCTION_DEPLOYMENT_GUIDE.md`

## Quick Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

## What Happens to ngrok?

You won't need it anymore! 

- **Development**: Use `npm run dev` (localhost)
- **Testing on phone**: Use ngrok temporarily
- **Production**: Use Vercel URL (permanent)

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Added all environment variables
- [ ] Set `NEXT_PUBLIC_APP_URL` to Vercel URL
- [ ] Redeployed
- [ ] Tested on production URL
- [ ] Sent verification email
- [ ] Tested on phone
- [ ] Everything works! ✅

## Need More Details?

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for:
- Detailed Vercel setup
- Alternative platforms (Netlify, AWS, etc.)
- Custom domain setup
- Email service options
- Troubleshooting
- Cost breakdown

---

**Ready to deploy?** Just push to GitHub and deploy to Vercel - takes 5 minutes! 🚀
