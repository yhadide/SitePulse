const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// Matomo configuration - update with your Railway URL
const MATOMO_URL = process.env.MATOMO_URL || 'https://your-railway-url.up.railway.app';
const MATOMO_TOKEN = process.env.MATOMO_TOKEN; // Get from Matomo settings

// Ensure data directories exist
const matomoDir = path.join('data', 'matomo');
if (!fs.existsSync(matomoDir)) {
  fs.mkdirSync(matomoDir, { recursive: true });
}

async function getMatomoData(siteId, method, period = 'day', date = 'today') {
  if (!MATOMO_TOKEN) {
    throw new Error('MATOMO_TOKEN environment variable not set');
  }

  const url = `${MATOMO_URL}/index.php`;
  const formData = new URLSearchParams({
    module: 'API',
    method: method,
    idSite: siteId,
    period: period,
    date: date,
    format: 'JSON',
    token_auth: MATOMO_TOKEN
  });

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching Matomo data for site ${siteId}:`, error.message);
    return null;
  }
}

async function collectMatomoMetrics() {
  const timestamp = new Date().toISOString();
  const results = [];

  console.log(`📊 Starting Matomo data collection at ${timestamp}`);

  // Site ID mapping - your actual Matomo site IDs
  const siteMapping = {
    'golden-beach-villas': 1,  // GlodenBeachVillas site ID
    'gelball-store': 2         // Gelball store site ID
  };

  for (const site of config.sites) {
    const siteId = siteMapping[site.name];
    if (!siteId) {
      console.log(`⚠️  No Matomo site ID configured for ${site.name}`);
      continue;
    }

    console.log(`Collecting data for ${site.name} (Site ID: ${siteId})...`);

    try {
      // Get visitor summary
      const visitorSummary = await getMatomoData(siteId, 'VisitsSummary.get');

      // Get page performance
      const pagePerformance = await getMatomoData(siteId, 'PagePerformance.get');

      // Get real-time visitor count
      const liveCounters = await getMatomoData(siteId, 'Live.getCounters', 'range', 'last30');

      const result = {
        timestamp,
        site: site.name,
        siteId: siteId,
        url: site.url,
        success: true,
        error: null,
        metrics: {
          // Visitor metrics
          visits: visitorSummary?.nb_visits || 0,
          unique_visitors: visitorSummary?.nb_uniq_visitors || 0,
          page_views: visitorSummary?.nb_actions || 0,
          bounce_rate: visitorSummary?.bounce_rate || 0,
          avg_time_on_site: visitorSummary?.avg_time_on_site || 0,

          // Performance metrics (if available)
          avg_page_load_time: pagePerformance?.avg_page_load_time || 0,
          avg_dom_processing_time: pagePerformance?.avg_dom_processing_time || 0,
          avg_dom_completion_time: pagePerformance?.avg_dom_completion_time || 0,

          // Live metrics
          visitors_online: liveCounters?.visitors || 0
        }
      };

      results.push(result);
      console.log(`✅ ${site.name}: ${result.metrics.visits} visits, ${result.metrics.unique_visitors} unique visitors`);

    } catch (error) {
      const result = {
        timestamp,
        site: site.name,
        siteId: siteId,
        url: site.url,
        success: false,
        error: error.message,
        metrics: null
      };

      results.push(result);
      console.log(`❌ ${site.name}: ${error.message}`);
    }
  }

  // Save results
  const date = timestamp.split('T')[0]; // YYYY-MM-DD
  const dailyFile = path.join(matomoDir, `matomo-${date}.json`);
  const latestFile = path.join(matomoDir, 'matomo-latest.json');

  // Save daily file
  let dailyData = [];
  if (fs.existsSync(dailyFile)) {
    dailyData = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  }
  dailyData.push(...results);
  fs.writeFileSync(dailyFile, JSON.stringify(dailyData, null, 2));

  // Save latest file
  fs.writeFileSync(latestFile, JSON.stringify(results, null, 2));

  console.log(`📊 Matomo data saved to ${dailyFile} and matomo-latest.json`);

  return results;
}

// Detect anomalies in visitor data
function detectAnomalies(currentData, historicalData) {
  const anomalies = [];

  for (const current of currentData) {
    if (!current.success) continue;

    const historical = historicalData.filter(h => h.site === current.site && h.success);
    if (historical.length < 7) continue; // Need at least a week of data

    const avgVisits = historical.reduce((sum, h) => sum + h.metrics.visits, 0) / historical.length;
    const avgBounceRate = historical.reduce((sum, h) => sum + h.metrics.bounce_rate, 0) / historical.length;

    // Traffic spike detection (3x normal traffic)
    if (current.metrics.visits > avgVisits * 3) {
      anomalies.push({
        site: current.site,
        type: 'traffic_spike',
        message: `Traffic spike: ${current.metrics.visits} visits (avg: ${Math.round(avgVisits)})`
      });
    }

    // High bounce rate detection (50% higher than normal)
    if (current.metrics.bounce_rate > avgBounceRate * 1.5 && current.metrics.bounce_rate > 70) {
      anomalies.push({
        site: current.site,
        type: 'high_bounce_rate',
        message: `High bounce rate: ${current.metrics.bounce_rate}% (avg: ${Math.round(avgBounceRate)}%)`
      });
    }
  }

  return anomalies;
}

// Run the collection
if (require.main === module) {
  collectMatomoMetrics().catch(error => {
    console.error('💥 Matomo collection failed:', error);
    process.exit(1);
  });
}

module.exports = { collectMatomoMetrics, detectAnomalies };