# SitePulse

**Comprehensive website monitoring with analytics, security scanning, and intelligent alerts**

A monitoring stack built for WordPress & Shopify sites that combines uptime tracking, performance analysis, visitor analytics, sales monitoring, and security scanning into automated daily reports.

## What This Does

A complete monitoring solution that tracks multiple aspects of website health and business performance, providing actionable insights through automated analysis and smart notifications.

### Business Intelligence
- Real-time sales tracking with Shopify Admin API integration
- Visitor analytics via self-hosted Matomo on Railway
- Revenue spike detection with intelligent anomaly alerts
- Product performance insights and order source analysis

### Security Monitoring
- WordPress integrity checks with authenticated API access
- Vulnerability scanning for exposed files and weak configurations
- Plugin update monitoring and security score tracking
- User permission auditing and malware detection

### Performance & Uptime
- Lighthouse CI integration with Core Web Vitals tracking
- Global uptime monitoring with response time analysis
- Performance budget enforcement with custom thresholds
- Historical trend analysis and performance degradation alerts

### Intelligent Automation
- Smart Discord notifications with context-aware alerts
- Automated daily reports combining all monitoring data
- GitHub Actions CI/CD for zero-maintenance operation
- Version-controlled monitoring data with full audit trail

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Actions│    │   Railway Cloud  │    │   Discord       │
│   Daily Monitoring   │   Matomo Analytics    │   Smart Alerts   │
│                 │    │                  │    │                 │
│ • Uptime Checks │    │ • Visitor Data   │    │ • Sales Spikes  │
│ • Lighthouse CI │───▶│ • Performance    │───▶│ • Security Issues│
│ • Shopify API   │    │ • Security Scans │    │ • Performance   │
│ • WordPress API │    │ • Historical Data│    │ • Downtime      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Storage  │    │   React Dashboard│    │   CLI Management│
│   Version Control    │   Vercel Hosting │    │   Site Management│
│                 │    │                  │    │                 │
│ • JSON Metrics  │    │ • Real-time Charts│   │ • Add/Remove Sites│
│ • Git History   │    │ • Trend Analysis │    │ • Interactive Setup│
│ • Audit Trail   │    │ • Status Overview│    │ • Help System   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Technical Implementation

### Technology Stack
- **Frontend**: React + Chart.js dashboard on Vercel
- **Backend**: Node.js monitoring scripts on GitHub Actions
- **Analytics**: Self-hosted Matomo on Railway
- **Database**: MariaDB for analytics + JSON for metrics
- **Notifications**: Discord webhooks with smart filtering
- **CLI**: Interactive site management tools

### Active Monitoring
Currently monitoring production websites with real data:
- **WordPress site**: Security monitoring with vulnerability detection
- **Shopify store**: Sales tracking and order analysis
- **Automated reporting**: Daily comprehensive status updates

## CLI Tools & Management

Built-in command-line tools make scaling effortless:

```bash
# Site Management
npm run add-site      # Interactive site addition wizard
npm run remove-site   # Safe site removal with confirmation  
npm run list-sites    # Overview of all monitored sites

# Monitoring Commands  
npm run uptime        # Check website availability
npm run lighthouse    # Performance audits with Core Web Vitals
npm run matomo        # Collect visitor analytics
npm run shopify-orders      # Sales and revenue analysis
npm run wordpress-integrity # Security and health checks

# Alerts & Reports
npm run advanced-status     # Comprehensive Discord reports
npm run advanced-alerts     # Intelligent issue notifications

# Help & Documentation
npm run help          # Complete CLI reference
```

## Live Monitoring Examples

### Shopify Sales Intelligence
```
Shopify Sales Update - Example Store
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
24-Hour Summary
   Orders: 4
   Revenue: 1,400 MAD  
   Avg Order Value: 350 MAD

Recent Activity
   Orders (1h): 0
   Revenue (1h): 0 MAD

Best Sellers (24h)
   • Product A: 2 sold
   • Product B: 1 sold
   • Product C: 3 sold
```

### WordPress Security Report
```
WordPress Security Report - Example WordPress Site
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Security Score: 75/100

Scan Results
   Issues Found: 3
   High Priority: 0
   Medium Priority: 2

Security Checks
   ✅ WordPress API accessible
   ✅ Sensitive files protected  
   ✅ No malware detected
   ✅ 12 plugins, all updated

Action Required
   • Missing security headers
   • Consider enabling 2FA
```

## Key Capabilities

### Smart Alerting
- Context-aware notifications that filter out noise
- Business logic integration for meaningful alerts
- Trend analysis for performance degradation detection
- Configurable alert suppression and escalation

### Multi-Platform Support
- **WordPress**: Security scanning, plugin monitoring, user auditing
- **Shopify**: Sales analytics, order tracking, revenue monitoring
- **Static Sites**: Uptime and performance analysis
- **Extensible**: Easy to add support for other platforms

### Automated Reporting
- Daily comprehensive reports combining all monitoring data
- Structured Discord notifications with actionable insights
- Historical trend analysis with performance baselines
- Custom performance budgets and threshold management

### Management Tools
- Interactive CLI for site management and configuration
- Version-controlled monitoring configuration
- Comprehensive help system and documentation
- Modular architecture for easy customization

## What's Next

This monitoring stack is actively being enhanced with:

- Advanced alerting rules engine with custom business logic
- Cache optimization analysis for performance improvements  
- Multi-region monitoring for global performance insights
- Professional Grafana dashboards for enterprise visualization

## Documentation

**Setup guide coming soon!** This README showcases what's possible - a complete setup tutorial will be available to help you build your own monitoring stack.

For now, explore the codebase to see how comprehensive monitoring can be built entirely on free infrastructure.

## Built With

- **GitHub Actions** - Automated monitoring workflows
- **Railway** - Matomo analytics hosting  
- **Vercel** - React dashboard deployment
- **Discord** - Smart notification system
- **Node.js** - Monitoring scripts and CLI tools
- **MariaDB** - Analytics data storage
- **React + Chart.js** - Beautiful data visualization

---

**Built to demonstrate comprehensive monitoring capabilities using modern web technologies and free infrastructure**

*A practical implementation of automated website monitoring, analytics, and alerting*