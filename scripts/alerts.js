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
      text: "SitePulse Monitoring • Next check in 30 minutes"
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

module.exports = {
  checkAndSendAlerts,
  sendStatusUpdates,
  sendMatomoUpdates,
  createUptimeAlert,
  createPerformanceAlert,
  createUptimeUpdate,
  createPerformanceUpdate,
  createMatomoUpdate
};