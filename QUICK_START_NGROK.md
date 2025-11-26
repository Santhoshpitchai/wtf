# Quick Start: ngrok Setup (5 Minutes)

## What You Need

ngrok will create a public URL like `https://abc123.ngrok.io` that works from ANYWHERE:
- ✅ Mobile data (4G/5G)
- ✅ Different WiFi networks  
- ✅ Any device, any location
- ✅ Can share with others

## Setup Steps

### 1. Sign Up (1 minute)

Go to: [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)

Sign up with Google/GitHub (easiest) or email.

### 2. Get Auth Token (30 seconds)

After signup, copy your auth token from:
[https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)

It looks like: `2abc123def456ghi789jkl`

### 3. Configure ngrok (30 seconds)

Run this command with YOUR token:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 4. Start Dev Server (Terminal 1)

```bash
npm run dev
```

Keep this running!

### 5. Start ngrok (Terminal 2 - NEW terminal)

```bash
ngrok http 3000
```

You'll see:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### 6. Copy Your URL

Copy the HTTPS URL: `https://abc123.ngrok.io`

### 7. Update .env.local

```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

Use YOUR URL, not the example!

### 8. Restart Dev Server

Go to Terminal 1:
- Press `Ctrl+C`
- Run `npm run dev` again

### 9. Test!

1. Send verification email
2. Open on ANY device (phone on 4G, anywhere!)
3. Click link
4. Works! 🎉

## Important

⚠️ **The URL changes every time you restart ngrok!**

When you restart ngrok tomorrow:
1. You'll get a NEW URL (like `https://xyz789.ngrok.io`)
2. Update `.env.local` with the new URL
3. Restart dev server
4. Old emails won't work (they have old URL)

**Solution:** ngrok paid plan ($8/mo) gives you a permanent URL that never changes.

## Quick Commands

```bash
# Terminal 1: Dev Server
npm run dev

# Terminal 2: ngrok
ngrok http 3000

# View ngrok dashboard
# Open browser: http://localhost:4040
```

## Need Help?

See `NGROK_SETUP_GUIDE.md` for detailed instructions and troubleshooting.

---

**That's it!** Your verification emails will now work from anywhere in the world! 🌍
