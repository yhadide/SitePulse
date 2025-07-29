# SitePulse Railway Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Railway Setup
- [ ] Sign up at https://railway.app with GitHub
- [ ] Create new project from GitHub repo
- [ ] Add MySQL database service
- [ ] Configure environment variables (see `railway-env-template.md`)

### 2. Matomo Configuration
- [ ] Visit your Railway URL
- [ ] Complete Matomo setup wizard
- [ ] Create admin account
- [ ] Add websites:
  - Golden Beach Villas: https://goldenbeachvillas.com
  - Gelball Store: https://gelball.ma
- [ ] Generate API token from Administration → Personal → Security

### 3. GitHub Integration
- [ ] Add GitHub secrets:
  - `MATOMO_URL`: Your Railway URL
  - `MATOMO_TOKEN`: Your Matomo API token
  - `DS_WEBHOOK_URL`: Your Discord webhook
- [ ] Re-enable GitHub Actions (uncomment schedule in monitor.yml)

### 4. Website Integration
- [ ] Update WordPress tracking code (Site ID 1)
- [ ] Update Shopify tracking code (Site ID 2)
- [ ] Test tracking with browser dev tools

### 5. Testing
- [ ] Test API integration: `npm run test-matomo`
- [ ] Test Discord alerts: `npm run status`
- [ ] Verify dashboard updates on Vercel

## 🔧 Environment Variables

See `railway-env-template.md` for complete list.

## 🎯 Expected Results

After deployment:
- ✅ Matomo accessible at Railway URL
- ✅ Real visitor tracking on both websites
- ✅ Automated monitoring every 30 minutes
- ✅ Discord notifications for issues
- ✅ Live dashboard with analytics data

## 🆘 Troubleshooting

### Common Issues:
1. **Database connection failed**: Check MySQL service is running
2. **Tracking not working**: Verify CORS settings in Matomo
3. **API calls failing**: Check MATOMO_URL and MATOMO_TOKEN
4. **No Discord alerts**: Verify DS_WEBHOOK_URL secret

### Debug Commands:
```bash
# Test Matomo API connection
MATOMO_URL="your-url" MATOMO_TOKEN="your-token" npm run matomo

# Test Discord webhook
npm run status

# Check all monitoring
npm run uptime && npm run lighthouse && npm run matomo
```