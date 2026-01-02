# SSL Configuration for Nginx
# Place your SSL certificates in this directory

# For production, use certificates from:
# - Let's Encrypt (free): certbot or acme.sh
# - Commercial CA: DigiCert, GlobalSign, etc.
# - Cloud provider: AWS ACM, Google Cloud CA, etc.

# Certificate files should be:
# - cert.pem (SSL certificate)
# - key.pem (private key)
# - Optionally: chain.pem (intermediate certificates)

# Example Let's Encrypt with certbot:
# certbot certonly --webroot -w /var/www/html -d yourdomain.com -d www.yourdomain.com

# Example with acme.sh:
# acme.sh --issue -d yourdomain.com -d www.yourdomain.com --webroot /var/www/html

# For self-signed certificates (development only):
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=yourdomain.com"

# Security best practices:
# - Use 2048-bit or higher RSA keys, or ECDSA
# - Keep certificates updated (auto-renew)
# - Use strong cipher suites
# - Enable OCSP stapling
# - Configure HSTS headers
# - Regular security audits