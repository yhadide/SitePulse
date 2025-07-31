#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const readline = require('readline');

// Colors for console output
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateSiteName(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '');
  } catch {
    return 'new-site';
  }
}

async function addNewSite() {
  log('\n🚀 SitePulse - Add New Website', 'bold');
  log('=====================================', 'cyan');
  
  try {
    // Load current configuration
    const configPath = path.join(process.cwd(), 'sites.yaml');
    let config;
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.parse(configContent);
    } else {
      log('❌ sites.yaml not found. Please run this from the SitePulse root directory.', 'red');
      process.exit(1);
    }

    log('\n📝 Please provide the following information:', 'blue');
    
    // Get website URL
    let url;
    while (true) {
      url = await askQuestion('\n🌐 Website URL (e.g., https://example.com): ');
      if (!url) {
        log('❌ URL is required', 'red');
        continue;
      }
      if (!validateUrl(url)) {
        log('❌ Please enter a valid URL (including https://)', 'red');
        continue;
      }
      break;
    }

    // Generate default site name
    const defaultName = generateSiteName(url);
    const siteName = await askQuestion(`\n📛 Site name (default: ${defaultName}): `) || defaultName;

    // Get site type
    let siteType;
    while (true) {
      log('\n🏗️  Site type options:', 'blue');
      log('  1. WordPress', 'cyan');
      log('  2. Shopify', 'cyan');
      log('  3. Static/Other', 'cyan');
      
      const typeChoice = await askQuestion('\nSelect site type (1-3): ');
      
      switch (typeChoice) {
        case '1':
          siteType = 'wordpress';
          break;
        case '2':
          siteType = 'shopify';
          break;
        case '3':
          siteType = 'static';
          break;
        default:
          log('❌ Please select 1, 2, or 3', 'red');
          continue;
      }
      break;
    }

    // Get performance budgets
    log('\n⚡ Performance Budget Settings:', 'blue');
    log('(Press Enter for defaults)', 'yellow');
    
    const lcpMs = await askQuestion('🎯 LCP (Largest Contentful Paint) in ms (default: 2500): ') || '2500';
    const tbtMs = await askQuestion('⏱️  TBT (Total Blocking Time) in ms (default: 300): ') || '300';
    const perfScore = await askQuestion('📊 Performance Score threshold (default: 80): ') || '80';
    const uptimeThreshold = await askQuestion('🔍 Uptime response threshold in ms (default: 5000): ') || '5000';

    // Get tags
    const tagsInput = await askQuestion('\n🏷️  Tags (comma-separated, e.g., production,ecommerce): ') || 'production';
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);

    // Create new site object
    const newSite = {
      name: siteName,
      type: siteType,
      url: url.endsWith('/') ? url : url + '/',
      perf_budget: {
        lcp_ms: parseInt(lcpMs),
        tbt_ms: parseInt(tbtMs),
        perf_score: parseInt(perfScore),
        uptime_threshold: parseInt(uptimeThreshold)
      },
      tags: tags
    };

    // Check if site already exists
    const existingSite = config.sites.find(site => 
      site.name === siteName || site.url === newSite.url
    );

    if (existingSite) {
      log(`\n❌ Site already exists with name "${existingSite.name}" or URL "${existingSite.url}"`, 'red');
      const overwrite = await askQuestion('Do you want to overwrite it? (y/N): ');
      
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        log('❌ Operation cancelled', 'yellow');
        rl.close();
        return;
      }

      // Remove existing site
      config.sites = config.sites.filter(site => 
        site.name !== siteName && site.url !== newSite.url
      );
    }

    // Add new site to configuration
    config.sites.push(newSite);

    // Show preview
    log('\n📋 Site Configuration Preview:', 'blue');
    log('================================', 'cyan');
    log(`Name: ${newSite.name}`, 'green');
    log(`Type: ${newSite.type}`, 'green');
    log(`URL: ${newSite.url}`, 'green');
    log(`Performance Budget:`, 'green');
    log(`  - LCP: ${newSite.perf_budget.lcp_ms}ms`, 'cyan');
    log(`  - TBT: ${newSite.perf_budget.tbt_ms}ms`, 'cyan');
    log(`  - Performance Score: ${newSite.perf_budget.perf_score}`, 'cyan');
    log(`  - Uptime Threshold: ${newSite.perf_budget.uptime_threshold}ms`, 'cyan');
    log(`Tags: ${newSite.tags.join(', ')}`, 'green');

    // Confirm before saving
    const confirm = await askQuestion('\n✅ Save this configuration? (Y/n): ');
    
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      log('❌ Operation cancelled', 'yellow');
      rl.close();
      return;
    }

    // Save updated configuration
    const updatedYaml = yaml.stringify(config, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0
    });

    fs.writeFileSync(configPath, updatedYaml, 'utf8');

    log('\n🎉 Success! Site added to monitoring configuration.', 'green');
    log(`\n📊 Total sites being monitored: ${config.sites.length}`, 'blue');

    // Show next steps
    log('\n🚀 Next Steps:', 'bold');
    log('1. Commit and push your changes:', 'cyan');
    log('   git add sites.yaml', 'yellow');
    log('   git commit -m "Add new site: ' + siteName + '"', 'yellow');
    log('   git push', 'yellow');
    
    log('\n2. If this is a Matomo-tracked site:', 'cyan');
    log('   - Add the site in your Matomo dashboard', 'yellow');
    log('   - Update the site ID mapping in scripts/matomo.js', 'yellow');
    
    if (siteType === 'wordpress') {
      log('\n3. For WordPress monitoring:', 'cyan');
      log('   - Set up Application Password if needed', 'yellow');
      log('   - Add WP_USERNAME and WP_APP_PASSWORD secrets', 'yellow');
    }
    
    if (siteType === 'shopify') {
      log('\n3. For Shopify monitoring:', 'cyan');
      log('   - Set up Admin API access', 'yellow');
      log('   - Add SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN secrets', 'yellow');
    }

    log('\n4. Test the monitoring:', 'cyan');
    log('   npm run uptime', 'yellow');
    log('   npm run lighthouse', 'yellow');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('\n🚀 SitePulse - Add New Website', 'bold');
  log('=====================================', 'cyan');
  log('\nUsage:', 'blue');
  log('  npm run add-site', 'green');
  log('  node scripts/add-site.js', 'green');
  log('\nOptions:', 'blue');
  log('  --help, -h    Show this help message', 'cyan');
  log('  --list, -l    List current sites', 'cyan');
  log('\nDescription:', 'blue');
  log('  Interactive CLI tool to add new websites to your SitePulse monitoring stack.', 'cyan');
  log('  Supports WordPress, Shopify, and static sites with customizable performance budgets.', 'cyan');
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  try {
    const configPath = path.join(process.cwd(), 'sites.yaml');
    if (!fs.existsSync(configPath)) {
      log('❌ sites.yaml not found', 'red');
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(configContent);

    log('\n📊 Current Monitored Sites:', 'bold');
    log('============================', 'cyan');
    
    config.sites.forEach((site, index) => {
      log(`\n${index + 1}. ${site.name}`, 'green');
      log(`   Type: ${site.type}`, 'cyan');
      log(`   URL: ${site.url}`, 'cyan');
      log(`   Tags: ${site.tags.join(', ')}`, 'yellow');
    });

    log(`\n📈 Total: ${config.sites.length} sites`, 'blue');
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  addNewSite().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { addNewSite };