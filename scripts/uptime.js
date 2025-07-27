const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// Ensure data directories exist
const uptimeDir = path.join('data', 'uptime');
if (!fs.existsSync(uptimeDir)) {
  fs.mkdirSync(uptimeDir, { recursive: true });
}

async function checkUptime() {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0]; // YYYY-MM-DD
  const results = [];
  let hasFailures = false;

  console.log(`🔍 Starting uptime checks at ${timestamp}`);

  for (const site of config.sites) {
    console.log(`Checking ${site.name} (${site.url})...`);
    
    const startTime = Date.now();
    let result = {
      timestamp,
      site: site.name,
      url: site.url,
      status_code: null,
      response_ms: null,
      success: false,
      error: null
    };

    try {
      const response = await axios.get(site.url, {
        timeout: 10000, // 10 second timeout
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      const responseTime = Date.now() - startTime;
      
      result.status_code = response.status;
      result.response_ms = responseTime;
      result.success = response.status === 200 && responseTime <= site.perf_budget.uptime_threshold;
      
      if (!result.success) {
        hasFailures = true;
        if (response.status !== 200) {
          result.error = `HTTP ${response.status}`;
        } else if (responseTime > site.perf_budget.uptime_threshold) {
          result.error = `Slow response: ${responseTime}ms > ${site.perf_budget.uptime_threshold}ms`;
        }
      }
      
      console.log(`✅ ${site.name}: ${response.status} (${responseTime}ms)`);
      
    } catch (error) {
      result.error = error.message;
      result.response_ms = Date.now() - startTime;
      hasFailures = true;
      console.log(`❌ ${site.name}: ${error.message}`);
    }

    results.push(result);
  }

  // Save daily file
  const dailyFile = path.join(uptimeDir, `uptime-${date}.json`);
  let dailyData = [];
  
  if (fs.existsSync(dailyFile)) {
    dailyData = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  }
  
  dailyData.push(...results);
  fs.writeFileSync(dailyFile, JSON.stringify(dailyData, null, 2));

  // Save latest file
  const latestFile = path.join(uptimeDir, 'uptime-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(results, null, 2));

  console.log(`📊 Results saved to ${dailyFile} and uptime-latest.json`);
  
  // Exit with error code if there are failures (triggers GitHub Actions failure)
  if (hasFailures) {
    console.log('❌ Some checks failed - this will trigger alerts');
    process.exit(1);
  } else {
    console.log('✅ All checks passed');
    process.exit(0);
  }
}

// Run the checks
checkUptime().catch(error => {
  console.error('💥 Uptime check script failed:', error);
  process.exit(1);
});