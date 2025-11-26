# ngrok Setup Guide - Access from Anywhere!

## What is ngrok?

ngrok creates a secure public URL that tunnels to your local development server. This means:
- ✅ Works from ANY device, ANYWHERE
- ✅ Works on mobile data (4G/5G)
- ✅ Works on different WiFi networks
- ✅ Can share with others for testing
- ✅ HTTPS (secure)

## Quick Setup (5 minutes)

### Step 1: Sign Up for ngrok (Free)

1. Go to [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. Sign up with Google/GitHub or email
3. It's completely free!

### Step 2: Get Your Auth Token

1. After signing up, you'll see your auth token
2. Or go to: [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy the token (looks like: `2abc123def456ghi789jkl`)

### Step 3: Configure ngrok

Run this command with YOUR token:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

Example:
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl
```

You should see:
```
Authtoken saved to configuration file: /Users/yourname/.ngrok2/ngrok.yml
```

### Step 4: Start Your Dev Server

Open a terminal and run:

```bash
npm run dev
```

Keep this terminal open!

### Step 5: Start ngrok (in a NEW terminal)

Open a **second terminal** and run:

```bash
ngrok http 3000
```

You'll see something like:

```
ngrok                                                                    

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### Step 6: Copy Your Public URL

Look for the line that says:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

Copy the HTTPS URL: `https://abc123.ngrok.io`

### Step 7: Update .env.local

Open `.env.local` and update:

```bash
# Change from:
NEXT_PUBLIC_APP_URL=http://10.208.159.115:3000

# To your ngrok URL:
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

**Important:** Use YOUR ngrok URL, not the example above!

### Step 8: Restart Your Dev Server

Go back to the first terminal (where `npm run dev` is running):
- Press `Ctrl+C` to stop
- Run `npm run dev` again

### Step 9: Test It!

1. Send a verification email
2. Open email on ANY device (phone on 4G, tablet, anywhere!)
3. Click the verification link
4. It works from anywhere! 🎉

## Using the Helper Script (Easier Way)

I've created a script that does steps 4-5 automatically:

```bash
./start-with-ngrok.sh
```

This will:
1. Start your dev server
2. Start ngrok
3. Show you the public URL
4. Keep both running

## Important Notes

### Free Tier Limitations

**The URL changes every time you restart ngrok!**

When you stop and restart ngrok, you get a new URL like:
- First time: `https://abc123.ngrok.io`
- Second time: `https://xyz789.ngrok.io` ← Different!

This means:
1. You need to update `.env.local` each time
2. Old verification emails won't work (they have the old URL)
3. You need to restart your dev server after updating

### Paid Tier Benefits ($8/month)

- ✅ **Permanent URL** - Never changes!
- ✅ Custom domain - Use your own domain
- ✅ More connections
- ✅ Better performance

If you're doing a lot of testing, the paid tier is worth it!

## Workflow

### Every Time You Start Development:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
ngrok http 3000
```

**Then:**
1. Copy the ngrok URL from Terminal 2
2. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
3. Restart Terminal 1 (Ctrl+C, then `npm run dev`)
4. Start testing!

### Or Use the Script:

```bash
./start-with-ngrok.sh
```

Then follow the instructions it shows.

## Viewing ngrok Dashboard

While ngrok is running, you can see all requests:

1. Open browser
2. Go to: `http://localhost:4040`
3. See all HTTP requests in real-time
4. Great for debugging!

## Troubleshooting

### "command not found: ngrok"

**Problem:** ngrok is not installed

**Solution:**
```bash
# Mac:
brew install ngrok/ngrok/ngrok

# Or using npm:
npm install -g ngrok
```

### "authentication failed"

**Problem:** ngrok auth token not configured

**Solution:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### "tunnel not found"

**Problem:** ngrok stopped or crashed

**Solution:**
1. Check if ngrok is still running in Terminal 2
2. If not, restart it: `ngrok http 3000`
3. Update `.env.local` with new URL
4. Restart dev server

### Email links still show old URL

**Problem:** Didn't restart dev server after updating `.env.local`

**Solution:**
1. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
2. Restart dev server (Ctrl+C, then `npm run dev`)
3. Send a NEW email (old emails have old URL)

### "ERR_NGROK_3200"

**Problem:** Multiple ngrok instances running

**Solution:**
```bash
# Kill all ngrok processes
pkill ngrok

# Start fresh
ngrok http 3000
```

## Alternative: Permanent Solution

If you don't want to deal with changing URLs, consider:

### Option 1: ngrok Paid Plan ($8/month)
- Permanent URL that never changes
- Worth it if you're testing frequently

### Option 2: Deploy to Vercel (Free)
- Permanent URL
- Production-ready
- See `FIX_MOBILE_ACCESS.md` for instructions

### Option 3: Use Your Own Domain
- Set up port forwarding on your router
- Point a domain to your IP
- More complex but free

## Security Notes

### Is ngrok secure?

✅ **Yes!** ngrok uses HTTPS and is designed for this purpose.

However:
- ⚠️ Your local dev server is now accessible to anyone with the URL
- ⚠️ Don't share the URL publicly
- ⚠️ Don't commit the URL to version control
- ⚠️ The URL is temporary (changes when you restart)

### Best Practices

- ✅ Only share the URL with people who need to test
- ✅ Stop ngrok when you're done testing
- ✅ Use authentication in your app
- ✅ Don't use ngrok for production (deploy properly instead)

## Current Setup

After following this guide, you'll have:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-unique-id.ngrok.io

# Terminal 1: Dev Server
npm run dev

# Terminal 2: ngrok
ngrok http 3000
```

## Testing Checklist

- [ ] Signed up for ngrok
- [ ] Configured auth token
- [ ] Started dev server (`npm run dev`)
- [ ] Started ngrok (`ngrok http 3000`)
- [ ] Copied ngrok URL
- [ ] Updated `.env.local` with ngrok URL
- [ ] Restarted dev server
- [ ] Sent verification email
- [ ] Tested on phone (mobile data)
- [ ] Tested on different WiFi
- [ ] Link works from anywhere! ✅

## Quick Reference

### Start Everything
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

### Update URL
```bash
# 1. Copy URL from ngrok terminal
# 2. Update .env.local:
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# 3. Restart dev server (Terminal 1)
Ctrl+C
npm run dev
```

### Stop Everything
```bash
# Terminal 1: Ctrl+C
# Terminal 2: Ctrl+C
```

---

**You're ready to test from anywhere!** 🌍

Just follow the steps above and your verification emails will work on any device, anywhere in the world!
