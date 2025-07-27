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

// Only run alerts if this script is called directly (not imported)
if (require.main === module) {
  checkAndSendAlerts().catch(error => {
    console.error('💥 Alert script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkAndSendAlerts, createUptimeAlert, createPerformanceAlert };