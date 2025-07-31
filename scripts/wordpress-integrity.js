const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// WordPress configuration
const WP_SITE_URL = process.env.WP_SITE_URL || 'https://example-wordpress.com';
const WP_USERNAME = process.env.WP_USERNAME; // Your WordPress admin username
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD; // Application password from WordPress

// Create authentication headers if credentials are provided
function getAuthHeaders() {
  if (WP_USERNAME && WP_APP_PASSWORD) {
    const credentials = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'User-Agent': 'SitePulse-Monitor/1.0'
    };
  }
  return {
    'User-Agent': 'SitePulse-Monitor/1.0'
  };
}

// Ensure data directories exist
const wpDir = path.join('data', 'wordpress');
if (!fs.existsSync(wpDir)) {
  fs.mkdirSync(wpDir, { recursive: true });
}

async function checkWordPressIntegrity() {
  const timestamp = new Date().toISOString();
  console.log(`🔒 Starting WordPress integrity check at ${timestamp}`);

  const results = {
    timestamp,
    site_url: WP_SITE_URL,
    checks: {},
    issues: [],
    security_score: 100,
    success: true
  };

  try {
    // 1. Check WordPress version and core integrity
    await checkCoreIntegrity(results);

    // 2. Check for common security headers
    await checkSecurityHeaders(results);

    // 3. Check for malware signatures
    await checkMalwareSignatures(results);

    // 4. Check plugin/theme versions
    await checkPluginThemeVersions(results);

    // 5. Check for common vulnerabilities
    await checkCommonVulnerabilities(results);

    // 6. Authenticated checks (if credentials provided)
    if (WP_USERNAME && WP_APP_PASSWORD) {
      await checkAuthenticatedEndpoints(results);
      await checkPluginUpdates(results);
      await checkUserSecurity(results);
      await checkDatabaseHealth(results);
    }

    // Calculate final security score
    results.security_score = calculateSecurityScore(results);

    // Save results
    saveIntegrityData(results);

    console.log(`✅ WordPress integrity check completed`);
    console.log(`🔒 Security Score: ${results.security_score}/100`);
    console.log(`⚠️  Issues Found: ${results.issues.length}`);

    if (results.issues.length > 0) {
      console.log('Issues detected:');
      results.issues.forEach(issue => {
        console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    }

    return results;

  } catch (error) {
    results.success = false;
    results.error = error.message;
    results.security_score = 0;

    saveIntegrityData(results);
    console.error(`❌ WordPress integrity check failed: ${error.message}`);
    return results;
  }
}

async function checkCoreIntegrity(results) {
  console.log('🔍 Checking WordPress core integrity...');

  try {
    // Get WordPress version
    const versionResponse = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SitePulse-Monitor/1.0'
      }
    });

    const wpVersion = versionResponse.data?.namespaces ? 'detected' : 'unknown';
    results.checks.wp_api_accessible = true;
    results.checks.wp_version = wpVersion;

    // Check if WordPress API is properly secured
    if (versionResponse.data?.namespaces?.includes('wp/v2')) {
      results.checks.rest_api_enabled = true;
    }

    // Try to access sensitive files (should be blocked)
    await checkSensitiveFileAccess(results);

  } catch (error) {
    results.checks.wp_api_accessible = false;
    results.issues.push({
      type: 'api_access',
      severity: 'medium',
      message: 'WordPress REST API not accessible - site may be down or blocked'
    });
  }
}

async function checkSensitiveFileAccess(results) {
  const sensitiveFiles = [
    '/wp-config.php',
    '/wp-config-sample.php',
    '/.htaccess',
    '/wp-content/debug.log',
    '/readme.html',
    '/license.txt'
  ];

  results.checks.sensitive_files_protected = true;

  for (const file of sensitiveFiles) {
    try {
      const response = await axios.get(`${WP_SITE_URL}${file}`, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      });

      if (response.status === 200 && response.data.length > 100) {
        results.checks.sensitive_files_protected = false;
        results.issues.push({
          type: 'file_exposure',
          severity: 'high',
          message: `Sensitive file exposed: ${file} (${response.status})`
        });
      }
    } catch (error) {
      // Good - file is not accessible
    }
  }
}

async function checkSecurityHeaders(results) {
  console.log('🛡️  Checking security headers...');

  try {
    const response = await axios.get(WP_SITE_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SitePulse-Monitor/1.0'
      }
    });

    const headers = response.headers;
    const requiredHeaders = {
      'x-frame-options': 'X-Frame-Options header missing',
      'x-content-type-options': 'X-Content-Type-Options header missing',
      'x-xss-protection': 'X-XSS-Protection header missing',
      'strict-transport-security': 'HSTS header missing (HTTPS sites)'
    };

    results.checks.security_headers = {};

    Object.entries(requiredHeaders).forEach(([header, message]) => {
      const hasHeader = headers[header] || headers[header.toLowerCase()];
      results.checks.security_headers[header] = !!hasHeader;

      if (!hasHeader) {
        results.issues.push({
          type: 'security_header',
          severity: 'medium',
          message: message
        });
      }
    });

  } catch (error) {
    results.issues.push({
      type: 'header_check',
      severity: 'low',
      message: 'Could not check security headers'
    });
  }
}

async function checkMalwareSignatures(results) {
  console.log('🦠 Checking for malware signatures...');

  try {
    const response = await axios.get(WP_SITE_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SitePulse-Monitor/1.0'
      }
    });

    const content = response.data.toLowerCase();

    // Common malware signatures
    const malwareSignatures = [
      'eval(base64_decode',
      'eval(gzinflate',
      'eval(str_rot13',
      'eval(gzuncompress',
      'base64_decode(',
      'gzinflate(',
      'str_rot13(',
      'gzuncompress(',
      'preg_replace.*\/e',
      'assert(',
      'create_function',
      'file_get_contents.*http',
      'curl_exec',
      'shell_exec',
      'system(',
      'passthru(',
      'exec(',
      '<?php /*',
      'wp_head.*remove_action'
    ];

    results.checks.malware_signatures_found = [];

    malwareSignatures.forEach(signature => {
      if (content.includes(signature.toLowerCase())) {
        results.checks.malware_signatures_found.push(signature);
        results.issues.push({
          type: 'malware_signature',
          severity: 'high',
          message: `Potential malware signature detected: ${signature}`
        });
      }
    });

    results.checks.malware_scan_clean = results.checks.malware_signatures_found.length === 0;

  } catch (error) {
    results.issues.push({
      type: 'malware_scan',
      severity: 'low',
      message: 'Could not perform malware scan'
    });
  }
}

async function checkPluginThemeVersions(results) {
  console.log('🔌 Checking plugin/theme information...');

  try {
    // Try to detect WordPress generator meta tag
    const response = await axios.get(WP_SITE_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SitePulse-Monitor/1.0'
      }
    });

    const content = response.data;

    // Check if WordPress version is exposed
    const generatorMatch = content.match(/<meta name="generator" content="WordPress ([^"]+)"/i);
    if (generatorMatch) {
      results.checks.wp_version_exposed = true;
      results.checks.wp_version = generatorMatch[1];
      results.issues.push({
        type: 'version_disclosure',
        severity: 'low',
        message: `WordPress version exposed in meta tag: ${generatorMatch[1]}`
      });
    } else {
      results.checks.wp_version_exposed = false;
    }

    // Check for common plugin signatures
    const commonPlugins = [
      'wp-content/plugins/woocommerce',
      'wp-content/plugins/yoast',
      'wp-content/plugins/elementor',
      'wp-content/plugins/contact-form-7',
      'wp-content/plugins/akismet'
    ];

    results.checks.detected_plugins = [];
    commonPlugins.forEach(plugin => {
      if (content.includes(plugin)) {
        const pluginName = plugin.split('/').pop();
        results.checks.detected_plugins.push(pluginName);
      }
    });

  } catch (error) {
    results.issues.push({
      type: 'plugin_detection',
      severity: 'low',
      message: 'Could not detect plugin information'
    });
  }
}

async function checkCommonVulnerabilities(results) {
  console.log('🚨 Checking for common vulnerabilities...');

  const vulnerabilityChecks = [
    {
      path: '/wp-admin/',
      expectedStatus: [302, 200], // Should redirect to login or show login
      name: 'Admin area protection'
    },
    {
      path: '/wp-login.php',
      expectedStatus: [200],
      name: 'Login page accessibility'
    },
    {
      path: '/xmlrpc.php',
      expectedStatus: [405, 403], // Should be disabled or restricted
      name: 'XML-RPC endpoint'
    },
    {
      path: '/wp-json/wp/v2/users',
      expectedStatus: [401, 403], // Should require authentication
      name: 'User enumeration via REST API'
    }
  ];

  results.checks.vulnerability_scan = {};

  for (const check of vulnerabilityChecks) {
    try {
      const response = await axios.get(`${WP_SITE_URL}${check.path}`, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'SitePulse-Monitor/1.0'
        }
      });

      const statusOk = check.expectedStatus.includes(response.status);
      results.checks.vulnerability_scan[check.name] = statusOk;

      if (!statusOk) {
        const severity = check.path.includes('xmlrpc') || check.path.includes('users') ? 'medium' : 'low';
        results.issues.push({
          type: 'vulnerability',
          severity: severity,
          message: `${check.name}: Unexpected status ${response.status} for ${check.path}`
        });
      }

    } catch (error) {
      results.checks.vulnerability_scan[check.name] = false;
    }
  }
}

function calculateSecurityScore(results) {
  let score = 100;

  results.issues.forEach(issue => {
    switch (issue.severity) {
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  return Math.max(0, score);
}

function saveIntegrityData(result) {
  const date = result.timestamp.split('T')[0]; // YYYY-MM-DD
  const dailyFile = path.join(wpDir, `wordpress-integrity-${date}.json`);
  const latestFile = path.join(wpDir, 'wordpress-integrity-latest.json');

  // Save daily file
  let dailyData = [];
  if (fs.existsSync(dailyFile)) {
    try {
      dailyData = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
    } catch (error) {
      dailyData = [];
    }
  }
  dailyData.push(result);
  fs.writeFileSync(dailyFile, JSON.stringify(dailyData, null, 2));

  // Save latest file
  fs.writeFileSync(latestFile, JSON.stringify(result, null, 2));

  console.log(`🔒 WordPress integrity data saved to ${dailyFile} and wordpress-integrity-latest.json`);
}

async function checkAuthenticatedEndpoints(results) {
  console.log('🔐 Checking authenticated endpoints...');

  try {
    // Test authentication by accessing user info
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/users/me`, {
      timeout: 10000,
      headers: getAuthHeaders()
    });

    results.checks.authentication_working = true;
    results.checks.authenticated_user = response.data.name || 'Unknown';
    results.checks.user_capabilities = response.data.capabilities || {};

    console.log(`✅ Authenticated as: ${response.data.name}`);

  } catch (error) {
    results.checks.authentication_working = false;
    results.issues.push({
      type: 'authentication',
      severity: 'medium',
      message: 'WordPress API authentication failed - check credentials'
    });
  }
}

async function checkPluginUpdates(results) {
  console.log('🔌 Checking plugin updates...');

  try {
    // Get installed plugins
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/plugins`, {
      timeout: 10000,
      headers: getAuthHeaders()
    });

    const plugins = response.data;
    results.checks.total_plugins = plugins.length;
    results.checks.active_plugins = plugins.filter(p => p.status === 'active').length;
    results.checks.plugins_needing_updates = plugins.filter(p => p.update_available).length;

    // Check for plugins with available updates
    const outdatedPlugins = plugins.filter(p => p.update_available);
    if (outdatedPlugins.length > 0) {
      results.issues.push({
        type: 'plugin_updates',
        severity: 'medium',
        message: `${outdatedPlugins.length} plugins need updates: ${outdatedPlugins.map(p => p.name).slice(0, 3).join(', ')}`
      });
    }

    // Check for inactive plugins (security risk)
    const inactivePlugins = plugins.filter(p => p.status === 'inactive');
    if (inactivePlugins.length > 5) {
      results.issues.push({
        type: 'inactive_plugins',
        severity: 'low',
        message: `${inactivePlugins.length} inactive plugins detected - consider removing unused plugins`
      });
    }

    console.log(`✅ Plugins: ${plugins.length} total, ${results.checks.active_plugins} active, ${results.checks.plugins_needing_updates} need updates`);

  } catch (error) {
    results.issues.push({
      type: 'plugin_check',
      severity: 'low',
      message: 'Could not check plugin status - may require higher permissions'
    });
  }
}

async function checkUserSecurity(results) {
  console.log('👥 Checking user security...');

  try {
    // Get user list (should be restricted)
    const response = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/users`, {
      timeout: 10000,
      headers: getAuthHeaders()
    });

    const users = response.data;
    results.checks.total_users = users.length;
    
    // Check for admin users
    const adminUsers = users.filter(u => u.capabilities && (u.capabilities.administrator || u.roles?.includes('administrator')));
    results.checks.admin_users = adminUsers.length;

    if (adminUsers.length > 3) {
      results.issues.push({
        type: 'too_many_admins',
        severity: 'medium',
        message: `${adminUsers.length} admin users detected - consider limiting admin access`
      });
    }

    // Check for weak usernames
    const weakUsernames = users.filter(u => ['admin', 'administrator', 'root', 'test'].includes(u.slug.toLowerCase()));
    if (weakUsernames.length > 0) {
      results.issues.push({
        type: 'weak_usernames',
        severity: 'medium',
        message: `Weak usernames detected: ${weakUsernames.map(u => u.slug).join(', ')}`
      });
    }

    console.log(`✅ Users: ${users.length} total, ${adminUsers.length} admins`);

  } catch (error) {
    // This might fail if user enumeration is properly blocked
    results.checks.user_enumeration_blocked = true;
    console.log('✅ User enumeration appears to be blocked (good!)');
  }
}

async function checkDatabaseHealth(results) {
  console.log('🗄️ Checking database health...');

  try {
    // Check posts and pages
    const postsResponse = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/posts`, {
      timeout: 10000,
      headers: getAuthHeaders(),
      params: { per_page: 1 }
    });

    const pagesResponse = await axios.get(`${WP_SITE_URL}/wp-json/wp/v2/pages`, {
      timeout: 10000,
      headers: getAuthHeaders(),
      params: { per_page: 1 }
    });

    results.checks.total_posts = parseInt(postsResponse.headers['x-wp-total'] || '0');
    results.checks.total_pages = parseInt(pagesResponse.headers['x-wp-total'] || '0');

    // Check for excessive revisions (performance issue)
    if (results.checks.total_posts > 100) {
      results.issues.push({
        type: 'database_optimization',
        severity: 'low',
        message: 'Consider cleaning up post revisions and spam comments for better performance'
      });
    }

    console.log(`✅ Content: ${results.checks.total_posts} posts, ${results.checks.total_pages} pages`);

  } catch (error) {
    results.issues.push({
      type: 'database_check',
      severity: 'low',
      message: 'Could not check database health via API'
    });
  }
}

// Enhanced security score calculation
function calculateSecurityScore(results) {
  let score = 100;
  
  results.issues.forEach(issue => {
    switch (issue.severity) {
      case 'high':
        score -= 20;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  // Bonus points for good security practices
  if (results.checks.authentication_working) score += 5;
  if (results.checks.user_enumeration_blocked) score += 5;
  if (results.checks.plugins_needing_updates === 0) score += 5;
  if (results.checks.sensitive_files_protected) score += 5;

  return Math.max(0, Math.min(100, score));
}

// Run the integrity check
if (require.main === module) {
  checkWordPressIntegrity().catch(error => {
    console.error('💥 WordPress integrity check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkWordPressIntegrity, calculateSecurityScore };