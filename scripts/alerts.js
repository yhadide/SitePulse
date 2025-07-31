const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// Discord webhook URL from environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function createUptimeAlert(results) {
  const failedSites = results.filter(r => !r.success);

  if (failedSites.length === 0) return null;

  const embed = {
    title: "🚨 Site Uptime Alert",
    color: 0xff0000, // Red
    timestamp: new Date().toISOString(),
    fields: failedSites.map(site => ({
      name: `${site.site} (${site.url})`,
      value: `**Status:** ${site.status_code || 'Error'}\n**Response Time:** ${site.response_ms}ms\n**Error:** ${site.error}`,
      inline: false
    })),
    footer: {
      text: "SitePulse Monitoring"
    }
  };

  return {
    embeds: [embed]
  };
}

function createUptimeUpdate(results) {
  const successSites = results.filter(r => r.success);
  const failedSites = results.filter(r => !r.success);

  const embed = {
    title: "📊 Uptime Check Complete",
    color: failedSites.length > 0 ? 0xffa500 : 0x00ff00,
    timestamp: new Date().toISOString(),
    description: `Checked ${results.length} sites`,
    fields: [
      {
        name: "✅ Online Sites",
        value: successSites.length > 0 ?
          successSites.map(site => `**${site.site}**: ${site.response_ms}ms`).join('\n') :
          'None',
        inline: true
      },
      {
        name: failedSites.length > 0 ? "❌ Issues Detected" : "📈 Status",
        value: failedSites.length > 0 ?
          failedSites.map(site => `**${site.site}**: ${site.error || 'Error'}`).join('\n') :
          'All systems operational',
        inline: true
      }
    ],
    footer: {
      text: "SitePulse Monitoring • Next check tomorrow"
    }
  };

  return {
    embeds: [embed]
  };
}

function createPerformanceAlert(results) {
  const violatedSites = results.filter(r => r.budget_violations && r.budget_violations.length > 0);

  if (violatedSites.length === 0) return null;

  const embed = {
    title: "⚠️ Performance Budget Alert",
    color: 0xffa500, // Orange
    timestamp: new Date().toISOString(),
    fields: violatedSites.map(site => ({
      name: `${site.site} (${site.url})`,
      value: `**Performance Score:** ${site.metrics?.performance_score || 'N/A'}\n**Violations:**\n${site.budget_violations.map(v => `• ${v}`).join('\n')}`,
      inline: false
    })),
    footer: {
      text: "SitePulse Monitoring"
    }
  };

  return {
    embeds: [embed]
  };
}

function createPerformanceUpdate(results) {
  const successfulSites = results.filter(r => r.success);
  const failedSites = results.filter(r => !r.success);
  const violatedSites = results.filter(r => r.budget_violations && r.budget_violations.length > 0);

  const embed = {
    title: "🚀 Performance Audit Complete",
    color: violatedSites.length > 0 ? 0xffa500 : 0x00ff00, // Orange if violations, Green if all good
    timestamp: new Date().toISOString(),
    description: `Audited ${results.length} sites with Lighthouse`,
    fields: successfulSites.map(site => ({
      name: `📈 ${site.site}`,
      value: site.success ?
        `**Performance:** ${site.metrics?.performance_score || 'N/A'}/100\n**LCP:** ${site.metrics?.lcp_ms || 'N/A'}ms\n**TBT:** ${site.metrics?.tbt_ms || 'N/A'}ms\n**CLS:** ${site.metrics?.cls || 'N/A'}` :
        `**Error:** ${site.error || 'Audit failed'}`,
      inline: true
    })),
    footer: {
      text: "SitePulse Monitoring • Next audit in 6 hours"
    }
  };

  // Add violations summary if any
  if (violatedSites.length > 0) {
    embed.fields.push({
      name: "⚠️ Budget Violations",
      value: violatedSites.map(site =>
        `**${site.site}:** ${site.budget_violations.join(', ')}`
      ).join('\n'),
      inline: false
    });
  }

  return {
    embeds: [embed]
  };
}

async function sendDiscordAlert(payload) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️  No Discord webhook URL configured - skipping alert');
    return;
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Discord alert sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Discord alert:', error.message);
  }
}

async function checkAndSendAlerts() {
  console.log('🔔 Checking for alerts...');

  // Check uptime alerts
  const uptimeLatestFile = path.join('data', 'uptime', 'uptime-latest.json');
  if (fs.existsSync(uptimeLatestFile)) {
    const uptimeResults = JSON.parse(fs.readFileSync(uptimeLatestFile, 'utf8'));
    const uptimeAlert = createUptimeAlert(uptimeResults);

    if (uptimeAlert) {
      console.log('🚨 Sending uptime alert...');
      await sendDiscordAlert(uptimeAlert);
    }
  }

  // Check performance alerts
  const perfLatestFile = path.join('data', 'perf', 'perf-latest.json');
  if (fs.existsSync(perfLatestFile)) {
    const perfResults = JSON.parse(fs.readFileSync(perfLatestFile, 'utf8'));
    const perfAlert = createPerformanceAlert(perfResults);

    if (perfAlert) {
      console.log('⚠️  Sending performance alert...');
      await sendDiscordAlert(perfAlert);
    }
  }

  console.log('✅ Alert check completed');
}

async function sendStatusUpdates() {
  console.log('📊 Sending status updates...');

  // Send uptime update
  const uptimeLatestFile = path.join('data', 'uptime', 'uptime-latest.json');
  if (fs.existsSync(uptimeLatestFile)) {
    const uptimeResults = JSON.parse(fs.readFileSync(uptimeLatestFile, 'utf8'));
    const uptimeUpdate = createUptimeUpdate(uptimeResults);

    console.log('📊 Sending uptime status update...');
    await sendDiscordAlert(uptimeUpdate);
  }

  // Send performance update
  const perfLatestFile = path.join('data', 'perf', 'perf-latest.json');
  if (fs.existsSync(perfLatestFile)) {
    const perfResults = JSON.parse(fs.readFileSync(perfLatestFile, 'utf8'));
    const perfUpdate = createPerformanceUpdate(perfResults);

    console.log('🚀 Sending performance status update...');
    await sendDiscordAlert(perfUpdate);
  }

  console.log('✅ Status updates sent');
}

// Only run alerts if this script is called directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--status-only')) {
    // Send status updates only (no alerts)
    sendStatusUpdates().catch(error => {
      console.error('💥 Status update script failed:', error);
      process.exit(1);
    });
  } else {
    // Default: check for alerts only
    checkAndSendAlerts().catch(error => {
      console.error('💥 Alert script failed:', error);
      process.exit(1);
    });
  }
}

function createMatomoUpdate(results) {
  const successfulSites = results.filter(r => r.success);

  if (successfulSites.length === 0) return null;

  const embed = {
    title: "📊 Analytics Update",
    color: 0x3b82f6, // Blue
    timestamp: new Date().toISOString(),
    description: `Visitor analytics for ${results.length} sites`,
    fields: successfulSites.map(site => ({
      name: `👥 ${site.site}`,
      value: `**Visits:** ${site.metrics.visits}\n**Unique Visitors:** ${site.metrics.unique_visitors}\n**Page Views:** ${site.metrics.page_views}\n**Bounce Rate:** ${site.metrics.bounce_rate}\n**Online Now:** ${site.metrics.visitors_online}`,
      inline: true
    })),
    footer: {
      text: "SitePulse Analytics • Next update in 6 hours"
    }
  };

  return {
    embeds: [embed]
  };
}

async function sendMatomoUpdates() {
  console.log('📊 Sending Matomo analytics updates...');

  const matomoLatestFile = path.join('data', 'matomo', 'matomo-latest.json');
  if (fs.existsSync(matomoLatestFile)) {
    const matomoResults = JSON.parse(fs.readFileSync(matomoLatestFile, 'utf8'));
    const matomoUpdate = createMatomoUpdate(matomoResults);

    if (matomoUpdate) {
      console.log('📊 Sending Matomo analytics update...');
      await sendDiscordAlert(matomoUpdate);
    }
  }

  console.log('✅ Matomo updates sent');
}

// Shopify Order Alerts
function createShopifyOrderAlert(result) {
  if (!result.alerts || result.anomalies.length === 0) return null;

  const highSeverityAnomalies = result.anomalies.filter(a => a.severity === 'high');
  if (highSeverityAnomalies.length === 0) return null;

  const embed = {
    title: "🛒 Shopify Order Alert",
    color: 0xff6b35, // Orange-red
    timestamp: new Date().toISOString(),
    description: `Unusual order activity detected on Shopify Store`,
    fields: [
      {
        name: "📊 Current Metrics",
        value: `**Orders (24h):** ${result.metrics.orders_24h}\n**Revenue (24h):** ${result.metrics.revenue_24h.toFixed(2)} MAD\n**Orders (1h):** ${result.metrics.orders_1h}\n**Avg Order Value:** ${result.metrics.avg_order_value_24h.toFixed(2)} MAD`,
        inline: true
      },
      {
        name: "🚨 Anomalies Detected",
        value: highSeverityAnomalies.map(anomaly => `• ${anomaly.message}`).join('\n'),
        inline: true
      }
    ],
    footer: {
      text: "SitePulse Shopify Monitor"
    }
  };

  // Add top products if available
  if (result.metrics.top_products && result.metrics.top_products.length > 0) {
    embed.fields.push({
      name: "🔥 Top Products",
      value: result.metrics.top_products.slice(0, 3).map(p => `• ${p.product}: ${p.quantity} sold`).join('\n'),
      inline: false
    });
  }

  return {
    embeds: [embed]
  };
}

function createShopifyOrderUpdate(result) {
  if (!result.success) return null;

  const embed = {
    title: "🛒 Shopify Sales Update",
    color: 0x00d4aa, // Shopify green
    timestamp: new Date().toISOString(),
    description: `Daily sales report for Shopify Store`,
    fields: [
      {
        name: "📈 24-Hour Summary",
        value: `**Orders:** ${result.metrics.orders_24h}\n**Revenue:** ${result.metrics.revenue_24h.toFixed(2)} MAD\n**Avg Order Value:** ${result.metrics.avg_order_value_24h.toFixed(2)} MAD`,
        inline: true
      },
      {
        name: "⚡ Recent Activity",
        value: `**Orders (1h):** ${result.metrics.orders_1h}\n**Revenue (1h):** ${result.metrics.revenue_1h.toFixed(2)} MAD`,
        inline: true
      }
    ],
    footer: {
      text: "SitePulse Shopify Monitor • Next update in 6 hours"
    }
  };

  // Add top products
  if (result.metrics.top_products && result.metrics.top_products.length > 0) {
    embed.fields.push({
      name: "🏆 Best Sellers (24h)",
      value: result.metrics.top_products.slice(0, 5).map(p => `• **${p.product}**: ${p.quantity} sold`).join('\n'),
      inline: false
    });
  }

  // Add order sources if available
  if (result.metrics.order_sources && Object.keys(result.metrics.order_sources).length > 0) {
    const sources = Object.entries(result.metrics.order_sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => `• ${source}: ${count} orders`)
      .join('\n');
    
    embed.fields.push({
      name: "📍 Order Sources",
      value: sources,
      inline: true
    });
  }

  return {
    embeds: [embed]
  };
}

// WordPress Security Alerts
function createWordPressSecurityAlert(result) {
  if (!result.success || result.issues.length === 0) return null;

  const highIssues = result.issues.filter(i => i.severity === 'high');
  const mediumIssues = result.issues.filter(i => i.severity === 'medium');

  // Only alert on high or multiple medium issues
  if (highIssues.length === 0 && mediumIssues.length < 3) return null;

  const embed = {
    title: "🔒 WordPress Security Alert",
    color: result.security_score < 50 ? 0xff0000 : 0xffa500, // Red if very low score, orange otherwise
    timestamp: new Date().toISOString(),
    description: `Security issues detected on WordPress Site`,
    fields: [
      {
        name: "🛡️ Security Score",
        value: `**${result.security_score}/100**`,
        inline: true
      },
      {
        name: "⚠️ Issues Found",
        value: `**High:** ${highIssues.length}\n**Medium:** ${mediumIssues.length}\n**Low:** ${result.issues.filter(i => i.severity === 'low').length}`,
        inline: true
      }
    ],
    footer: {
      text: "SitePulse WordPress Security"
    }
  };

  // Add high priority issues
  if (highIssues.length > 0) {
    embed.fields.push({
      name: "🚨 High Priority Issues",
      value: highIssues.slice(0, 5).map(issue => `• ${issue.message}`).join('\n'),
      inline: false
    });
  }

  // Add medium priority issues if there are many
  if (mediumIssues.length >= 3) {
    embed.fields.push({
      name: "⚠️ Medium Priority Issues",
      value: mediumIssues.slice(0, 3).map(issue => `• ${issue.message}`).join('\n'),
      inline: false
    });
  }

  return {
    embeds: [embed]
  };
}

function createWordPressSecurityUpdate(result) {
  if (!result.success) return null;

  const embed = {
    title: "🔒 WordPress Security Report",
    color: result.security_score >= 80 ? 0x00ff00 : result.security_score >= 50 ? 0xffa500 : 0xff0000,
    timestamp: new Date().toISOString(),
    description: `Security scan completed for WordPress Site`,
    fields: [
      {
        name: "🛡️ Security Score",
        value: `**${result.security_score}/100**`,
        inline: true
      },
      {
        name: "📊 Scan Results",
        value: `**Issues Found:** ${result.issues.length}\n**High Priority:** ${result.issues.filter(i => i.severity === 'high').length}\n**Medium Priority:** ${result.issues.filter(i => i.severity === 'medium').length}`,
        inline: true
      }
    ],
    footer: {
      text: "SitePulse WordPress Security • Next scan in 24 hours"
    }
  };

  // Add security status indicators
  const securityChecks = [];
  if (result.checks.wp_api_accessible) securityChecks.push("✅ WordPress API accessible");
  if (result.checks.sensitive_files_protected) securityChecks.push("✅ Sensitive files protected");
  else securityChecks.push("❌ Sensitive files exposed");
  if (result.checks.malware_scan_clean) securityChecks.push("✅ No malware detected");
  else securityChecks.push("❌ Potential malware found");

  if (securityChecks.length > 0) {
    embed.fields.push({
      name: "🔍 Security Checks",
      value: securityChecks.slice(0, 6).join('\n'),
      inline: false
    });
  }

  // Add critical issues if any
  const criticalIssues = result.issues.filter(i => i.severity === 'high');
  if (criticalIssues.length > 0) {
    embed.fields.push({
      name: "🚨 Action Required",
      value: criticalIssues.slice(0, 3).map(issue => `• ${issue.message}`).join('\n'),
      inline: false
    });
  }

  return {
    embeds: [embed]
  };
}

// Enhanced alert checking with new features
async function checkAndSendAdvancedAlerts() {
  console.log('🔔 Checking for advanced alerts...');

  // Check Shopify order alerts
  const shopifyLatestFile = path.join('data', 'shopify', 'shopify-orders-latest.json');
  if (fs.existsSync(shopifyLatestFile)) {
    const shopifyResult = JSON.parse(fs.readFileSync(shopifyLatestFile, 'utf8'));
    const shopifyAlert = createShopifyOrderAlert(shopifyResult);

    if (shopifyAlert) {
      console.log('🛒 Sending Shopify order alert...');
      await sendDiscordAlert(shopifyAlert);
    }
  }

  // Check WordPress security alerts
  const wpLatestFile = path.join('data', 'wordpress', 'wordpress-integrity-latest.json');
  if (fs.existsSync(wpLatestFile)) {
    const wpResult = JSON.parse(fs.readFileSync(wpLatestFile, 'utf8'));
    const wpAlert = createWordPressSecurityAlert(wpResult);

    if (wpAlert) {
      console.log('🔒 Sending WordPress security alert...');
      await sendDiscordAlert(wpAlert);
    }
  }

  console.log('✅ Advanced alert check completed');
}

async function sendAdvancedStatusUpdates() {
  console.log('📊 Sending advanced status updates...');

  // Send Shopify update
  const shopifyLatestFile = path.join('data', 'shopify', 'shopify-orders-latest.json');
  if (fs.existsSync(shopifyLatestFile)) {
    const shopifyResult = JSON.parse(fs.readFileSync(shopifyLatestFile, 'utf8'));
    const shopifyUpdate = createShopifyOrderUpdate(shopifyResult);

    if (shopifyUpdate) {
      console.log('🛒 Sending Shopify sales update...');
      await sendDiscordAlert(shopifyUpdate);
    }
  }

  // Send WordPress security update
  const wpLatestFile = path.join('data', 'wordpress', 'wordpress-integrity-latest.json');
  if (fs.existsSync(wpLatestFile)) {
    const wpResult = JSON.parse(fs.readFileSync(wpLatestFile, 'utf8'));
    const wpUpdate = createWordPressSecurityUpdate(wpResult);

    if (wpUpdate) {
      console.log('🔒 Sending WordPress security update...');
      await sendDiscordAlert(wpUpdate);
    }
  }

  console.log('✅ Advanced status updates sent');
}

module.exports = {
  checkAndSendAlerts,
  sendStatusUpdates,
  sendMatomoUpdates,
  checkAndSendAdvancedAlerts,
  sendAdvancedStatusUpdates,
  createUptimeAlert,
  createPerformanceAlert,
  createUptimeUpdate,
  createPerformanceUpdate,
  createMatomoUpdate,
  createShopifyOrderAlert,
  createShopifyOrderUpdate,
  createWordPressSecurityAlert,
  createWordPressSecurityUpdate
};