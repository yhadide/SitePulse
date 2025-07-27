const axios = require('axios');

// Test Discord webhook
async function testDiscordWebhook() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('❌ No DISCORD_WEBHOOK_URL environment variable found');
    console.log('Usage: DISCORD_WEBHOOK_URL="your_webhook_url" node test-discord.js');
    return;
  }

  console.log('🧪 Testing Discord webhook...');

  const testMessage = {
    embeds: [{
      title: "🧪 SitePulse Test Alert",
      description: "This is a test message to verify your Discord webhook is working!",
      color: 0x00ff00, // Green
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: "Status",
          value: "✅ Webhook connection successful",
          inline: false
        },
        {
          name: "Next Steps",
          value: "Your monitoring alerts will appear here when sites have issues",
          inline: false
        }
      ],
      footer: {
        text: "SitePulse Monitoring System"
      }
    }]
  };

  try {
    await axios.post(webhookUrl, testMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test message sent successfully!');
    console.log('Check your Discord server for the test message.');
    
  } catch (error) {
    console.error('❌ Failed to send test message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDiscordWebhook();