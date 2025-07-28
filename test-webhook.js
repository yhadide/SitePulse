const axios = require('axios');

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1399059269181116567/puUUDG9ll-K_orJcuo0BCZRuig2nLMSVJ6korCWOqjpDudKGRojaIsMPJZchzstfvGry";

async function testWebhook() {
  console.log('🧪 Testing Discord webhook...');

  const testMessage = {
    embeds: [{
      title: "🧪 SitePulse Test",
      description: "Testing webhook connection from GitHub Actions",
      color: 0x00ff00,
      timestamp: new Date().toISOString(),
      footer: {
        text: "SitePulse Monitoring Test"
      }
    }]
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, testMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook test successful!');
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testWebhook();