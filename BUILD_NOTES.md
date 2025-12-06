# Build Notes

## Expected Build Warnings

During `npm run build`, you may see PDF generation errors like:

```
[PDF Generator] Error (attempt 1/3): spawn ENOEXEC
[Test PDF] Error: Failed to generate invoice PDF after 3 attempts
```

**This is NORMAL and EXPECTED!** ✅

### Why This Happens

- During the build process, Next.js tries to pre-render all routes
- The `/api/test-pdf` endpoint tries to generate a PDF during build
- Chromium is not available during the build process (only at runtime)
- This causes the PDF generation to fail during build

### Why It's Not a Problem

1. **API routes don't need to be pre-rendered** - They run at request time
2. **Chromium will be available at runtime** - When deployed to Vercel
3. **The build still succeeds** - The error is caught and handled
4. **PDFs will work in production** - When the API is actually called

### How to Verify It Works

After deployment, test the endpoint:
```bash
curl https://wtforg.vercel.app/api/test-pdf -o test.pdf
```

If this downloads a PDF, everything is working correctly!

## Build Success Indicators

Look for these in the build output:

```
✓ Compiled successfully
✓ Generating static pages (24/24)
Route (app)                              Size     First Load JS
...
ƒ /api/test-pdf                        0 B                0 B
ƒ /api/invoices                        0 B                0 B
```

The `ƒ` symbol means "Dynamic" - these routes are server-rendered on demand, which is correct for API routes.

## Deployment Checklist

- [x] Build completes successfully
- [x] No TypeScript errors
- [x] API routes are marked as dynamic (ƒ)
- [ ] After deployment: Test `/api/test-pdf` endpoint
- [ ] After deployment: Create a test invoice
- [ ] After deployment: Verify email with PDF attachment

---

**Bottom Line:** Build warnings about PDF generation are expected and can be ignored. The real test is after deployment! 🚀
