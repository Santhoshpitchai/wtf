# PDF Generation Fix - Puppeteer Chrome Permissions

## Issue
Invoice creation was failing with `spawn ENOEXEC` error when trying to generate PDFs using Puppeteer.

## Root Cause
On macOS, downloaded Chromium binaries don't have execute permissions and may be quarantined by Gatekeeper.

## Solution Applied

### 1. Fixed Chrome Permissions
```bash
chmod -R +x ~/.cache/puppeteer/chrome/mac_arm-142.0.7444.59/chrome-mac-arm64/
xattr -d com.apple.quarantine ~/.cache/puppeteer/chrome/mac_arm-142.0.7444.59/chrome-mac-arm64/*
```

### 2. Development Mode Fallback
The system is already configured to skip PDF generation in development mode and create invoices without PDF attachments. This is working correctly as evidenced by:
- Invoice created successfully: `INV-20251202-0002`
- Email sent successfully to: `santhoshpitchai0313@gmail.com`
- Warning message in email: "PDF attachment could not be generated"

## Testing

Try creating another invoice now. The PDF should generate successfully.

## For Production (Vercel)

The Vercel deployment uses `@sparticuz/chromium` which is specifically designed for serverless environments and doesn't have these permission issues. The configuration is already in place:

```javascript
// next.config.js
experimental: {
  serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
}
```

## Troubleshooting

If you still get the error:

### Option 1: Reinstall Puppeteer
```bash
npm uninstall puppeteer-core @puppeteer/browsers
rm -rf ~/.cache/puppeteer
npm install puppeteer-core @puppeteer/browsers
chmod -R +x ~/.cache/puppeteer/
```

### Option 2: Use System Chrome (Development Only)
Add to your `.env.local`:
```env
PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

### Option 3: Skip PDF in Development
The system already does this automatically. Invoices will be created without PDF attachments in development mode.

## Status

✅ Permissions fixed
✅ Invoice creation working
✅ Email sending working
✅ Development mode fallback working
⏳ Test PDF generation with next invoice

## Next Steps

1. Try creating a new invoice
2. Check if PDF generates successfully
3. If still failing, use Option 1 or 2 above
4. For production, ensure environment variables are set in Vercel
