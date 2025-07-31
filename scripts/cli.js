#!/usr/bin/env node

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  log('\n🚀 SitePulse CLI - Website Monitoring Stack', 'bold');
  log('===========================================', 'cyan');
  
  log('\n📊 Site Management:', 'blue');
  log('  npm run add-site      Add a new website to monitoring', 'green');
  log('  npm run remove-site   Remove a website from monitoring', 'green');
  log('  npm run list-sites    List all monitored websites', 'green');
  
  log('\n🔍 Monitoring Commands:', 'blue');
  log('  npm run uptime        Check website uptime and response times', 'green');
  log('  npm run lighthouse    Run Lighthouse performance audits', 'green');
  log('  npm run matomo        Collect visitor analytics data', 'green');
  
  log('\n🛒 E-commerce Monitoring:', 'blue');
  log('  npm run shopify-orders      Analyze Shopify sales and orders', 'green');
  log('  npm run wordpress-integrity Check WordPress security and health', 'green');
  
  log('\n🔔 Alerts & Notifications:', 'blue');
  log('  npm run alerts              Send critical alerts to Discord', 'green');
  log('  npm run status              Send status updates to Discord', 'green');
  log('  npm run advanced-alerts     Send advanced monitoring alerts', 'green');
  log('  npm run advanced-status     Send comprehensive status reports', 'green');
  
  log('\n🏗️  Development:', 'blue');
  log('  npm run build         Build the React dashboard', 'green');
  log('  npm run deploy-check  Verify deployment readiness', 'green');
  
  log('\n📚 Help & Information:', 'blue');
  log('  npm run help          Show this help message', 'green');
  log('  node scripts/add-site.js --help     Detailed add-site help', 'cyan');
  log('  node scripts/remove-site.js --help  Detailed remove-site help', 'cyan');
  
  log('\n🔧 Configuration Files:', 'blue');
  log('  sites.yaml            Main configuration for monitored sites', 'cyan');
  log('  .github/workflows/    GitHub Actions automation', 'cyan');
  log('  data/                 Historical monitoring data', 'cyan');
  log('  dashboard/            React dashboard source code', 'cyan');
  
  log('\n🌐 Supported Site Types:', 'blue');
  log('  • WordPress sites (with security monitoring)', 'cyan');
  log('  • Shopify stores (with sales analytics)', 'cyan');
  log('  • Static sites (uptime and performance)', 'cyan');
  
  log('\n📈 What Gets Monitored:', 'blue');
  log('  ✅ Uptime and response times', 'green');
  log('  ✅ Performance scores (Lighthouse)', 'green');
  log('  ✅ Visitor analytics (Matomo)', 'green');
  log('  ✅ Sales data (Shopify)', 'green');
  log('  ✅ Security health (WordPress)', 'green');
  log('  ✅ Core Web Vitals (LCP, TBT, CLS)', 'green');
  
  log('\n🚀 Quick Start:', 'blue');
  log('  1. npm run add-site           # Add your first website', 'yellow');
  log('  2. npm run uptime             # Test uptime monitoring', 'yellow');
  log('  3. npm run lighthouse         # Test performance audits', 'yellow');
  log('  4. Set up GitHub secrets      # Enable automation', 'yellow');
  log('  5. Push to GitHub             # Start automated monitoring', 'yellow');
  
  log('\n📖 Documentation:', 'blue');
  log('  README.md             Complete setup and usage guide', 'cyan');
  log('  DEPLOYMENT.md         Deployment instructions', 'cyan');
  
  log('\n💡 Need help? Check the documentation or run specific --help commands!', 'yellow');
  log('');
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// If unknown command, show help
log('❌ Unknown command. Here\'s what you can do:', 'red');
showHelp();