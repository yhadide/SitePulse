const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Load configuration
const config = yaml.parse(fs.readFileSync('sites.yaml', 'utf8'));

// Shopify configuration
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL; // e.g., 'gelball.myshopify.com' or 'https://gelball.ma'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Extract domain from URL if full URL is provided
function getStoreDomain(storeUrl) {
    if (!storeUrl) return null;

    // If it's a full URL, extract the domain
    if (storeUrl.startsWith('http')) {
        try {
            const url = new URL(storeUrl);
            return url.hostname;
        } catch (error) {
            console.error('Invalid store URL format:', storeUrl);
            return null;
        }
    }

    // If it's already just a domain, return as-is
    return storeUrl;
}

// Ensure data directories exist
const shopifyDir = path.join('data', 'shopify');
if (!fs.existsSync(shopifyDir)) {
    fs.mkdirSync(shopifyDir, { recursive: true });
}

async function getShopifyOrders(timeframe = '24h') {
    if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
        throw new Error('Shopify credentials not configured');
    }

    const storeDomain = getStoreDomain(SHOPIFY_STORE_URL);
    if (!storeDomain) {
        throw new Error('Invalid store URL format');
    }

    // Calculate date range
    const now = new Date();
    const hoursAgo = timeframe === '24h' ? 24 : timeframe === '1h' ? 1 : 24;
    const since = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

    // For custom domains like gelball.ma, we need to use the .myshopify.com domain for API calls
    // The API doesn't work with custom domains
    let apiDomain = storeDomain;

    // If it's a custom domain (not .myshopify.com), we need the actual store name
    if (!storeDomain.includes('.myshopify.com')) {
        // For gelball.ma, the store name should be provided as environment variable
        const storeNameFromEnv = process.env.SHOPIFY_STORE_NAME; // e.g., 'gelball'
        if (storeNameFromEnv) {
            apiDomain = `${storeNameFromEnv}.myshopify.com`;
        } else {
            throw new Error('For custom domains, please set SHOPIFY_STORE_NAME environment variable (e.g., "gelball" for gelball.myshopify.com)');
        }
    }

    const url = `https://${apiDomain}/admin/api/2023-10/orders.json`;

    try {
        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            params: {
                status: 'any',
                created_at_min: since.toISOString(),
                limit: 250 // Max per request
            }
        });

        return response.data.orders;
    } catch (error) {
        console.error('Error fetching Shopify orders:', error.response?.data || error.message);
        throw error;
    }
}

async function analyzeOrderSpikes() {
    const timestamp = new Date().toISOString();
    console.log(`🛒 Starting Shopify order analysis at ${timestamp}`);

    try {
        // Get recent orders
        const recentOrders = await getShopifyOrders('24h');
        const hourlyOrders = await getShopifyOrders('1h');

        // Calculate metrics
        const metrics = {
            timestamp,
            orders_24h: recentOrders.length,
            orders_1h: hourlyOrders.length,
            revenue_24h: recentOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0),
            revenue_1h: hourlyOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0),
            avg_order_value_24h: recentOrders.length > 0 ?
                recentOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) / recentOrders.length : 0,
            top_products: getTopProducts(recentOrders),
            order_sources: getOrderSources(recentOrders),
            payment_methods: getPaymentMethods(recentOrders)
        };

        // Load historical data for comparison
        const historicalData = loadHistoricalOrderData();

        // Detect anomalies
        const anomalies = detectOrderAnomalies(metrics, historicalData);

        const result = {
            timestamp,
            success: true,
            metrics,
            anomalies,
            alerts: anomalies.length > 0
        };

        // Save results
        saveOrderData(result);

        console.log(`✅ Orders (24h): ${metrics.orders_24h}, Revenue: ${metrics.revenue_24h.toFixed(2)} MAD`);
        console.log(`✅ Orders (1h): ${metrics.orders_1h}, Revenue: ${metrics.revenue_1h.toFixed(2)} MAD`);

        if (anomalies.length > 0) {
            console.log(`🚨 Detected ${anomalies.length} anomalies:`);
            anomalies.forEach(anomaly => console.log(`  - ${anomaly.message}`));
        }

        return result;

    } catch (error) {
        const result = {
            timestamp,
            success: false,
            error: error.message,
            metrics: null,
            anomalies: [],
            alerts: false
        };

        saveOrderData(result);
        console.error(`❌ Shopify order analysis failed: ${error.message}`);
        return result;
    }
}

function getTopProducts(orders) {
    const productCounts = {};

    orders.forEach(order => {
        order.line_items?.forEach(item => {
            const productName = item.title || 'Unknown Product';
            productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
        });
    });

    return Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([product, quantity]) => ({ product, quantity }));
}

function getOrderSources(orders) {
    const sources = {};

    orders.forEach(order => {
        const source = order.source_name || 'Direct';
        sources[source] = (sources[source] || 0) + 1;
    });

    return sources;
}

function getPaymentMethods(orders) {
    const methods = {};

    orders.forEach(order => {
        const method = order.payment_gateway_names?.[0] || 'Unknown';
        methods[method] = (methods[method] || 0) + 1;
    });

    return methods;
}

function detectOrderAnomalies(current, historical) {
    const anomalies = [];

    if (historical.length < 7) return anomalies; // Need at least a week of data

    // Calculate averages from historical data
    const avgOrders24h = historical.reduce((sum, h) => sum + (h.metrics?.orders_24h || 0), 0) / historical.length;
    const avgRevenue24h = historical.reduce((sum, h) => sum + (h.metrics?.revenue_24h || 0), 0) / historical.length;
    const avgOrders1h = historical.reduce((sum, h) => sum + (h.metrics?.orders_1h || 0), 0) / historical.length;

    // Order spike detection (3x normal volume)
    if (current.orders_24h > avgOrders24h * 3) {
        anomalies.push({
            type: 'order_spike',
            severity: 'high',
            message: `Order spike detected: ${current.orders_24h} orders (avg: ${Math.round(avgOrders24h)})`
        });
    }

    // Revenue spike detection (3x normal revenue)
    if (current.revenue_24h > avgRevenue24h * 3) {
        anomalies.push({
            type: 'revenue_spike',
            severity: 'high',
            message: `Revenue spike detected: ${current.revenue_24h.toFixed(2)} MAD (avg: ${avgRevenue24h.toFixed(2)} MAD)`
        });
    }

    // Order drop detection (less than 50% of normal)
    if (current.orders_24h < avgOrders24h * 0.5 && avgOrders24h > 1) {
        anomalies.push({
            type: 'order_drop',
            severity: 'medium',
            message: `Order drop detected: ${current.orders_24h} orders (avg: ${Math.round(avgOrders24h)})`
        });
    }

    // Hourly spike detection (for immediate alerts)
    if (current.orders_1h > avgOrders1h * 5) {
        anomalies.push({
            type: 'hourly_spike',
            severity: 'high',
            message: `Hourly order spike: ${current.orders_1h} orders in last hour`
        });
    }

    return anomalies;
}

function loadHistoricalOrderData() {
    const files = fs.readdirSync(shopifyDir)
        .filter(file => file.startsWith('shopify-orders-') && file.endsWith('.json'))
        .sort()
        .slice(-30); // Last 30 days

    const historicalData = [];
    files.forEach(file => {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(shopifyDir, file), 'utf8'));
            if (Array.isArray(data)) {
                historicalData.push(...data.filter(d => d.success));
            } else if (data.success) {
                historicalData.push(data);
            }
        } catch (error) {
            // Skip corrupted files
        }
    });

    return historicalData;
}

function saveOrderData(result) {
    const date = result.timestamp.split('T')[0]; // YYYY-MM-DD
    const dailyFile = path.join(shopifyDir, `shopify-orders-${date}.json`);
    const latestFile = path.join(shopifyDir, 'shopify-orders-latest.json');

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

    console.log(`📊 Shopify order data saved to ${dailyFile} and shopify-orders-latest.json`);
}

// Run the analysis
if (require.main === module) {
    analyzeOrderSpikes().catch(error => {
        console.error('💥 Shopify order analysis failed:', error);
        process.exit(1);
    });
}

module.exports = { analyzeOrderSpikes, detectOrderAnomalies };