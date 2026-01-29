# 🚀 Quick Deployment Guide - v1.1.0

## Pre-Deployment Commands

```bash
# 1. Ensure Node.js v22 is active
source ~/.nvm/nvm.sh && nvm use 22

# 2. Verify dependencies
npm install

# 3. Run tests
npm run test

# 4. Build locally
npm run build

# 5. Check for errors
npm run lint
```

## Deploy to Production

```bash
# Option 1: Use deploy script (recommended)
chmod +x deploy.sh
./deploy.sh

# Option 2: Manual deploy
git add .
git commit -m "Release v1.1.0 - Payment management enhancements"
git push origin main
```

## Post-Deployment Verification

```bash
# Check production build
curl https://mvt-fe.onrender.com

# Check API health
curl https://mvt-events-api.onrender.com/actuator/health

# Monitor logs in Render dashboard
open https://dashboard.render.com
```

## Quick Feature Test

1. **Payment Report:**
   - Go to Payments page
   - Click purple 📄 button
   - Verify report displays with splits

2. **QR Code:**
   - Click blue 🖼️ button
   - Verify QR Code image loads
   - Test "Copy PIX Code" button

3. **Gateway Response:**
   - Click green/red ℹ️ button
   - Verify response displays

## Rollback (if needed)

```bash
# Quick rollback
git revert HEAD
git push origin main

# Or use Render dashboard to rollback to previous deployment
```

## New Files Added

- `/src/components/Payment/PaymentReportModal.tsx`
- `/CHANGELOG.md`
- `/RELEASE_NOTES_v1.1.0.md`
- `/DEPLOY_GUIDE.md` (this file)

## Modified Files

- `/src/components/Payment/PaymentCRUDPage.tsx` (QR Code + Report features)
- `/src/components/Generic/EntityCRUD.tsx` (disableView/disableEdit props)
- `/package.json` (version 1.1.0)
- `/deploy.sh` (updated comments)

## Environment Variables

No new environment variables required for this release.

## Database Changes

No database migrations required.

## API Dependencies

Requires backend v1.1.0+ with:
- `GET /api/payments/{id}/report`
- `GET /api/payments/{id}` (with QR Code fields)

---

**Ready to deploy!** 🎉
