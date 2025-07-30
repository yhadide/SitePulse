# SitePulse 🚀

**Free, open-source monitoring stack for WordPress & Shopify sites**

Monitor uptime, performance, and get alerts - all running on GitHub's free tier with zero paid services.

## 🎯 Features

- **Comprehensive Monitoring**: Daily checks including uptime, performance, analytics, sales, and security
- **Real-time Dashboard**: React dashboard hosted on GitHub Pages
- **Smart Alerts**: Discord webhooks when thresholds are violated
- **Zero Cost**: Runs entirely on GitHub Actions + GitHub Pages free tiers
- **Version Controlled**: All metrics stored as JSON in your repo

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Actions│    │   Data Storage   │    │  React Dashboard│
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ /data/uptime/    │    │ Chart.js graphs │
│ │Uptime Check │ ├────┤ /data/perf/      ├────┤ Site status     │
│ │Every 30min  │ │    │ JSON files       │    │ Performance     │
│ └─────────────┘ │    │                  │    │ trends          │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │                  │    │ GitHub Pages    │
│ │Lighthouse   │ │    │                  │    │ Static hosting  │
│ │Every 6hrs   │ │    │                  │    │                 │
│ └─────────────┘ │    │                  │    │                 │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │                  │    │                 │
│ │Discord      │ │    │                  │    │                 │
│ │Alerts       │ │    │                  │    │                 │
│ └─────────────┘ │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Fork & Clone
```bash
git clone https://github.com/yourusername/sitePulse.git
cd sitePulse
```

### 2. Deploy Matomo to Railway
1. **Sign up**: https://railway.app with GitHub
2. **Create project** from your sitePulse repository
3. **Add MySQL database** service
4. **Configure environment variables** (see `railway-env-template.md`)
5. **Complete Matomo setup** at your Railway URL

### 3. Configure Your Sites
Edit `sites.yaml`:
```yaml
sites:
  - name: my-wordpress-site
    type: wordpress
    url: https://yoursite.com
    perf_budget:
      lcp_ms: 2500
      tbt_ms: 300
      perf_score: 80
      uptime_threshold: 5000
```

### 4. Set Up Integrations
1. **Discord**: Create webhook, add to GitHub secrets as `DS_WEBHOOK_URL`
2. **GitHub Secrets**: Add `MATOMO_URL` and `MATOMO_TOKEN`
3. **Website Tracking**: Add Matomo tracking codes to your sites

### 5. Enable Monitoring
1. **Uncomment** schedule in `.github/workflows/monitor.yml`
2. **Enable GitHub Actions** in repository settings
3. **View dashboard** at your Vercel URL

📖 **Detailed guide**: See `DEPLOYMENT.md`

## 📊 Data Storage

All monitoring data is stored as JSON files in `/data/`:

```
/data/
├── uptime/
│   ├── uptime-latest.json      # Latest check results
│   └── uptime-2025-01-27.json  # Daily historical data
└── perf/
    ├── perf-latest.json        # Latest Lighthouse results
    ├── perf-summary-site1.json # Site performance history
    └── perf-site1-timestamp.json # Full Lighthouse reports
```

## ⚙️ Configuration

### Adding a New Site
1. Edit `sites.yaml`
2. Add your site configuration
3. Commit and push - monitoring starts automatically

### Adjusting Check Frequency
Edit `.github/workflows/monitor.yml`:
```yaml
schedule:
  - cron: '0 8 * * *'  # Daily at 8 AM UTC (comprehensive monitoring)
```

### Performance Budgets
```yaml
perf_budget:
  lcp_ms: 2500        # Largest Contentful Paint
  tbt_ms: 300         # Total Blocking Time  
  perf_score: 80      # Overall Lighthouse score
  uptime_threshold: 5000  # Response time threshold
```

## 🔧 Local Development

### Run Monitoring Scripts Locally
```bash
npm install
npm run uptime      # Test uptime checks
npm run lighthouse  # Test performance audits
npm run alerts      # Test Discord alerts
```

### Run Dashboard Locally
```bash
cd dashboard
npm install
npm run dev
```

### Deploy Dashboard
```bash
cd dashboard
npm run build
npm run deploy
```

## 📈 Understanding the Data

### Uptime Metrics
- **Status Code**: HTTP response (200 = good)
- **Response Time**: How fast your site responds
- **Success**: Green if status=200 AND response < threshold

### Performance Metrics
- **Performance Score**: 0-100 (90+ is excellent)
- **LCP**: Largest Contentful Paint (<2.5s is good)
- **TBT**: Total Blocking Time (<300ms is good)
- **CLS**: Cumulative Layout Shift (<0.1 is good)

### Alert Triggers
- Site returns non-200 status code
- Response time exceeds threshold
- Performance score drops below budget
- LCP/TBT exceeds budget limits

## 🔍 Troubleshooting

### GitHub Actions Not Running
1. Check Actions tab for error messages
2. Ensure workflows are enabled in repo settings
3. Verify secrets are set correctly

### Dashboard Not Loading Data
1. Check if data files exist in `/data/` folders
2. Verify GitHub Pages is enabled and deployed
3. Check browser console for CORS errors

### No Discord Alerts
1. Verify `DISCORD_WEBHOOK_URL` secret is set
2. Test webhook URL manually with curl
3. Check Actions logs for alert script errors

## 📋 Roadmap

### Phase 2 Features
- [ ] Matomo integration for user behavior analytics
- [ ] Shopify order spike detection via Admin API
- [ ] WordPress integrity checks (wp core verify-checksums)
- [ ] SMTP email alerts as Discord fallback
- [ ] Telegram alerts support
- [ ] CLI tool for adding sites

### Phase 3 Features  
- [ ] Prometheus + Grafana local Docker stack
- [ ] Cache headers validation
- [ ] CDN performance checks
- [ ] Multi-region monitoring
- [ ] Custom alert rules engine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own monitoring needs!

## 🆘 Support

- Create an issue for bugs or feature requests
- Check existing issues for common problems
- Join discussions for questions and tips

---

**Built with ❤️ for the WordPress & Shopify community**

