# Railway Environment Variables Template

## Required Environment Variables for Matomo Service

Copy these to your Railway Matomo service Variables tab:

### Database Configuration
```
MATOMO_DATABASE_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
MATOMO_DATABASE_ADAPTER=mysql
MATOMO_DATABASE_TABLES_PREFIX=matomo_
MATOMO_DATABASE_USERNAME=${{MySQL.MYSQL_USER}}
MATOMO_DATABASE_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
MATOMO_DATABASE_DBNAME=${{MySQL.MYSQL_DATABASE}}
```

### Security Configuration
```
MATOMO_SALT=your-random-32-character-salt-here
```

### Optional: Custom Domain
```
MATOMO_TRUSTED_HOSTS=your-custom-domain.com,your-railway-url.up.railway.app
```

## Required GitHub Secrets

Add these to your GitHub repository secrets:

```
MATOMO_URL=https://your-railway-url.up.railway.app
MATOMO_TOKEN=your-matomo-api-token
DS_WEBHOOK_URL=your-discord-webhook-url
```

### 📈 **Current Status**
- ✅ Matomo tracking codes installed on both websites
- ✅ Real visitor data being collected
- ✅ API integration working
- ✅ Ready for automated monitoring

## Next Steps

1. **Add GitHub Secrets** (see above)
2. **Enable GitHub Actions** (uncomment schedule in monitor.yml)
3. **Set up Discord webhook** for alerts
4. **Monitor your dashboard** on Vercel