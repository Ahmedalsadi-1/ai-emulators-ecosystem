#!/bin/bash

# SSL Certificate Generation Script
# Generates self-signed certificates for development/testing

set -e

DOMAIN=${1:-"yourdomain.com"}
DAYS=${2:-365}
SSL_DIR="./nginx/ssl"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 SSL Certificate Generation${NC}"
echo "=============================="

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates already exist in $SSL_DIR${NC}"
    echo -e "${YELLOW}   To regenerate, delete existing files first${NC}"
    exit 0
fi

echo "Generating self-signed SSL certificate for $DOMAIN..."
echo "Certificate will be valid for $DAYS days"
echo

# Generate private key
echo -e "${BLUE}Generating private key...${NC}"
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# Generate certificate signing request
echo -e "${BLUE}Generating certificate signing request...${NC}"
cat > "$SSL_DIR/cert.conf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
OU = Unit
CN = $DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

# Generate self-signed certificate
echo -e "${BLUE}Generating self-signed certificate...${NC}"
openssl req -new -x509 -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days "$DAYS" -config "$SSL_DIR/cert.conf" -extensions v3_req

# Set proper permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

# Clean up
rm -f "$SSL_DIR/cert.conf"

echo
echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
echo
echo "Certificate details:"
echo "  Certificate: $SSL_DIR/cert.pem"
echo "  Private Key: $SSL_DIR/key.pem"
echo "  Valid for: $DAYS days"
echo "  Domain: $DOMAIN"
echo
echo "Certificate info:"
openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before|Not After)"
echo
echo -e "${YELLOW}⚠️  WARNING: This is a self-signed certificate!${NC}"
echo "   - Only use for development/testing"
echo "   - Browsers will show security warnings"
echo "   - For production, use certificates from a trusted CA"
echo
echo "Next steps:"
echo "1. Update nginx.conf with your actual domain"
echo "2. For production: Use Let's Encrypt or commercial certificates"
echo "3. Test SSL: curl -k https://localhost:443/health"