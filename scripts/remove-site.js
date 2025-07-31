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

async function removeSite() {
  log('\n🗑️  SitePulse - Remove Website', 'bold');
  log('===============================', 'cyan');
  
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

    if (config.sites.length === 0) {
      log('📭 No sites configured for monitoring.', 'yellow');
      rl.close();
      return;
    }

    // Show current sites
    log('\n📊 Current Monitored Sites:', 'blue');
    log('============================', 'cyan');
    
    config.sites.forEach((site, index) => {
      log(`${index + 1}. ${site.name}`, 'green');
      log(`   Type: ${site.type}`, 'cyan');
      log(`   URL: ${site.url}`, 'cyan');
      log(`   Tags: ${site.tags.join(', ')}`, 'yellow');
      log('');
    });

    // Get site to remove
    let siteIndex;
    while (true) {
      const choice = await askQuestion(`\n🎯 Select site to remove (1-${config.sites.length}) or 'q' to quit: `);
      
      if (choice.toLowerCase() === 'q' || choice.toLowerCase() === 'quit') {
        log('❌ Operation cancelled', 'yellow');
        rl.close();
        return;
      }

      const index = parseInt(choice) - 1;
      if (isNaN(index) || index < 0 || index >= config.sites.length) {
        log(`❌ Please enter a number between 1 and ${config.sites.length}`, 'red');
        continue;
      }

      siteIndex = index;
      break;
    }

    const siteToRemove = config.sites[siteIndex];

    // Show site details
    log('\n🗑️  Site to Remove:', 'red');
    log('==================', 'cyan');
    log(`Name: ${siteToRemove.name}`, 'yellow');
    log(`Type: ${siteToRemove.type}`, 'yellow');
    log(`URL: ${siteToRemove.url}`, 'yellow');
    log(`Tags: ${siteToRemove.tags.join(', ')}`, 'yellow');

    // Confirm removal
    const confirm = await askQuestion('\n⚠️  Are you sure you want to remove this site? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log('❌ Operation cancelled', 'yellow');
      rl.close();
      return;
    }

    // Remove site from configuration
    config.sites.splice(siteIndex, 1);

    // Save updated configuration
    const updatedYaml = yaml.stringify(config, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0
    });

    fs.writeFileSync(configPath, updatedYaml, 'utf8');

    log('\n✅ Success! Site removed from monitoring configuration.', 'green');
    log(`📊 Remaining sites: ${config.sites.length}`, 'blue');

    // Show next steps
    log('\n🚀 Next Steps:', 'bold');
    log('1. Commit and push your changes:', 'cyan');
    log('   git add sites.yaml', 'yellow');
    log('   git commit -m "Remove site: ' + siteToRemove.name + '"', 'yellow');
    log('   git push', 'yellow');
    
    log('\n2. Clean up related data (optional):', 'cyan');
    log('   - Remove historical data from /data/ folders', 'yellow');
    log('   - Remove site from Matomo dashboard', 'yellow');
    log('   - Remove tracking codes from the website', 'yellow');

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
  log('\n🗑️  SitePulse - Remove Website', 'bold');
  log('===============================', 'cyan');
  log('\nUsage:', 'blue');
  log('  npm run remove-site', 'green');
  log('  node scripts/remove-site.js', 'green');
  log('\nOptions:', 'blue');
  log('  --help, -h    Show this help message', 'cyan');
  log('\nDescription:', 'blue');
  log('  Interactive CLI tool to remove websites from your SitePulse monitoring stack.', 'cyan');
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  removeSite().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { removeSite };