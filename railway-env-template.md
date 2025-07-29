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

## Railway Services Needed

1. **Matomo Service** (from this repository)
2. **MySQL Database** (add from Railway templates)

## Post-Deployment Steps

1. Visit your Railway URL
2. Complete Matomo setup wizard
3. Create admin account
4. Add websites (Golden Beach Villas, Gelball Store)
5. Generate API token
6. Update GitHub secrets
7. Update tracking codes on your websites