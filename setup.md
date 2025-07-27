# SitePulse Setup Guide

## Discord Webhook Setup

1. **Create Discord Server** (if you don't have one)
   - Open Discord → Create Server → "For me and my friends"
   - Name it "SitePulse Alerts" or similar

2. **Create Webhook**
   - Right-click your server → Server Settings
   - Go to Integrations → Webhooks
   - Click "New Webhook"
   - Name: "SitePulse Monitor"
   - Copy the Webhook URL (looks like: `https://discord.com/api/webhooks/...`)

3. **Add to GitHub Secrets**
   - Go to your GitHub repo
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Paste your webhook URL
   - Click "Add secret"

## GitHub Pages Setup

1. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Source: "GitHub Actions"
   - Save

2. **Enable GitHub Actions**
   - Go to Actions tab
   - Click "I understand my workflows, go ahead and enable them"

## Testing Your Setup

### Test Locally First
```bash
# Test uptime monitoring
npm run uptime

# Test performance audits (requires Chrome/Chromium)
npm run lighthouse

# Test alerts (requires DISCORD_WEBHOOK_URL env var)
DISCORD_WEBHOOK_URL="your_webhook_url" npm run alerts
```

### Manual GitHub Actions Run
1. Go to Actions tab
2. Click "Site Monitoring" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch the logs to see if everything works

## Your Sites Configuration

Your current sites in `sites.yaml`:
- **Golden Beach Villas** (WordPress): https://goldenbeachvillas.com/
- **Gelball Store** (Shopify): https://gelball.ma/

## Expected Timeline

- **First run**: ~5 minutes after enabling Actions
- **Dashboard live**: ~10 minutes after first successful run
- **Regular monitoring**: Every 30 minutes (uptime), every 6 hours (performance)
- **Your dashboard URL**: https://yourusername.github.io/sitePulse/

## Troubleshooting

### If Actions Fail
1. Check the Actions tab for error logs
2. Common issues:
   - Missing Discord webhook secret
   - Network timeouts (retry usually works)
   - Lighthouse installation issues

### If Dashboard Doesn't Load
1. Wait 10-15 minutes after first successful Action run
2. Check if GitHub Pages is enabled
3. Verify data files exist in `/data/` folders

### If No Alerts Come
1. Verify Discord webhook URL is correct
2. Test webhook manually with curl:
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test alert from SitePulse!"}'
```

## Next Steps

1. ✅ Set up Discord webhook
2. ✅ Enable GitHub Actions & Pages  
3. ✅ Run first workflow manually
4. ✅ Check your dashboard
5. ✅ Wait for first alert (hopefully never! 😄)

## Customization

### Add More Sites
Edit `sites.yaml` and add:
```yaml
  - name: my-new-site
    type: wordpress  # or shopify
    url: https://example.com
    perf_budget:
      lcp_ms: 2500
      tbt_ms: 300
      perf_score: 80
      uptime_threshold: 5000
    tags: ["production"]
```

### Adjust Alert Thresholds
Lower numbers = more sensitive alerts:
```yaml
perf_budget:
  lcp_ms: 2000      # Alert if LCP > 2 seconds
  tbt_ms: 200       # Alert if TBT > 200ms
  perf_score: 85    # Alert if score < 85
  uptime_threshold: 3000  # Alert if response > 3 seconds
```

### Change Monitoring Frequency
Edit `.github/workflows/monitor.yml`:
```yaml
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes (more frequent)
  - cron: '0 */2 * * *'   # Every 2 hours (more frequent)
```

**Note**: Be mindful of GitHub Actions limits (2000 minutes/month for free accounts).