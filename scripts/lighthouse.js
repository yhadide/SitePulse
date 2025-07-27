const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// Ensure data directories exist
const perfDir = path.join('data', 'perf');
if (!fs.existsSync(perfDir)) {
  fs.mkdirSync(perfDir, { recursive: true });
}

function runLighthouse(url) {
  return new Promise((resolve, reject) => {
    const lhci = spawn('npx', [
      '@lhci/cli',
      'collect',
      '--url', url,
      '--numberOfRuns', '1',
      '--settings.chromeFlags', '--no-sandbox --headless --disable-gpu',
      '--settings.output', 'json'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    lhci.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    lhci.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    lhci.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Lighthouse failed with code ${code}: ${stderr}`));
      }
    });
  });
}

function extractMetrics(lhResults) {
  try {
    // Parse the Lighthouse results
    const results = JSON.parse(lhResults);
    const audits = results.audits;
    
    return {
      performance_score: Math.round(results.categories.performance.score * 100),
      lcp_ms: Math.round(audits['largest-contentful-paint'].numericValue),
      tbt_ms: Math.round(audits['total-blocking-time'].numericValue),
      cls: parseFloat(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      fcp_ms: Math.round(audits['first-contentful-paint'].numericValue),
      speed_index: Math.round(audits['speed-index'].numericValue)
    };
  } catch (error) {
    console.error('Error parsing Lighthouse results:', error);
    return null;
  }
}

async function runPerformanceAudits() {
  const timestamp = new Date().toISOString();
  const results = [];
  let hasFailures = false;

  console.log(`🚀 Starting Lighthouse audits at ${timestamp}`);

  for (const site of config.sites) {
    console.log(`Auditing ${site.name} (${site.url})...`);
    
    let result = {
      timestamp,
      site: site.name,
      url: site.url,
      success: false,
      error: null,
      metrics: null,
      budget_violations: []
    };

    try {
      // Run Lighthouse
      const { stdout } = await runLighthouse(site.url);
      
      // Find the JSON results in stdout
      const jsonMatch = stdout.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('No JSON results found in Lighthouse output');
      }

      const metrics = extractMetrics(jsonMatch[1]);
      if (!metrics) {
        throw new Error('Failed to extract metrics from Lighthouse results');
      }

      result.metrics = metrics;
      result.success = true;

      // Check against performance budget
      const budget = site.perf_budget;
      if (metrics.lcp_ms > budget.lcp_ms) {
        result.budget_violations.push(`LCP: ${metrics.lcp_ms}ms > ${budget.lcp_ms}ms`);
      }
      if (metrics.tbt_ms > budget.tbt_ms) {
        result.budget_violations.push(`TBT: ${metrics.tbt_ms}ms > ${budget.tbt_ms}ms`);
      }
      if (metrics.performance_score < budget.perf_score) {
        result.budget_violations.push(`Performance: ${metrics.performance_score} < ${budget.perf_score}`);
      }

      if (result.budget_violations.length > 0) {
        hasFailures = true;
        console.log(`⚠️  ${site.name}: Budget violations - ${result.budget_violations.join(', ')}`);
      } else {
        console.log(`✅ ${site.name}: Performance score ${metrics.performance_score}, LCP ${metrics.lcp_ms}ms, TBT ${metrics.tbt_ms}ms`);
      }

    } catch (error) {
      result.error = error.message;
      hasFailures = true;
      console.log(`❌ ${site.name}: ${error.message}`);
    }

    results.push(result);

    // Save individual site results
    const siteFile = path.join(perfDir, `perf-${site.name}-${timestamp.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(siteFile, JSON.stringify(result, null, 2));

    // Update site summary
    const summaryFile = path.join(perfDir, `perf-summary-${site.name}.json`);
    let summary = [];
    
    if (fs.existsSync(summaryFile)) {
      summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    }
    
    // Keep last 100 entries
    summary.push({
      timestamp,
      performance_score: result.metrics?.performance_score || 0,
      lcp_ms: result.metrics?.lcp_ms || 0,
      tbt_ms: result.metrics?.tbt_ms || 0,
      cls: result.metrics?.cls || 0,
      success: result.success,
      budget_violations: result.budget_violations
    });
    
    if (summary.length > 100) {
      summary = summary.slice(-100);
    }
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  }

  // Save latest results
  const latestFile = path.join(perfDir, 'perf-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(results, null, 2));

  console.log(`📊 Performance results saved`);
  
  // Exit with error code if there are budget violations
  if (hasFailures) {
    console.log('❌ Some performance budgets violated - this will trigger alerts');
    process.exit(1);
  } else {
    console.log('✅ All performance budgets met');
    process.exit(0);
  }
}

// Run the audits
runPerformanceAudits().catch(error => {
  console.error('💥 Lighthouse audit script failed:', error);
  process.exit(1);
});