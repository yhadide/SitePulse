FROM matomo:4-apache

# Install additional dependencies for Railway
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Configure Apache for Railway
RUN a2enmod rewrite headers

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Create config directory if it doesn't exist
RUN mkdir -p /var/www/html/config && chown -R www-data:www-data /var/www/html/config

# Expose port (Railway will assign the PORT)
EXPOSE 80

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Apache
CMD ["apache2-foreground"]