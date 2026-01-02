#!/bin/bash

# Production Secrets Setup Script
# This script helps set up production secrets for the AI Ecosystem

set -e

echo "🔐 AI Ecosystem Production Secrets Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate a secure password
generate_password() {
    openssl rand -base64 32
}

# Function to setup a secret file
setup_secret() {
    local secret_name=$1
    local example_file="secrets/${secret_name}.txt.example"
    local secret_file="secrets/${secret_name}.txt"

    if [ -f "$secret_file" ]; then
        echo -e "${BLUE}✓${NC} $secret_name already exists"
        return
    fi

    if [ ! -f "$example_file" ]; then
        echo -e "${RED}✗${NC} Example file $example_file not found"
        return
    fi

    echo -e "${YELLOW}Setting up $secret_name...${NC}"

    case $secret_name in
        "postgres_password")
            echo "Generating secure PostgreSQL password..."
            generate_password > "$secret_file"
            ;;
        "jwt_secret")
            echo "Generating secure JWT secret..."
            openssl rand -hex 32 > "$secret_file"
            ;;
        "grafana_password")
            echo "Generating secure Grafana password..."
            openssl rand -base64 24 > "$secret_file"
            ;;
        "vnc_password")
            echo "Generating secure VNC password..."
            openssl rand -base64 12 > "$secret_file"
            ;;
        *)
            echo "Please enter your $secret_name (or press Enter to use example):"
            read -r value
            if [ -z "$value" ]; then
                cp "$example_file" "$secret_file"
                echo "Using example value. Please update $secret_file with your actual $secret_name"
            else
                echo "$value" > "$secret_file"
            fi
            ;;
    esac

    chmod 600 "$secret_file"
    echo -e "${GREEN}✓${NC} $secret_name setup complete"
}

# Create secrets directory if it doesn't exist
mkdir -p secrets

# List of required secrets
secrets=(
    "postgres_password"
    "jwt_secret"
    "grafana_password"
    "openai_api_key"
    "anthropic_api_key"
    "gemini_api_key"
    "google_api_key"
    "huggingface_token"
    "vnc_password"
    "slack_webhook_url"
    "ssl_cert"
    "ssl_key"
)

echo "Setting up production secrets..."
echo

# Setup each secret
for secret in "${secrets[@]}"; do
    setup_secret "$secret"
done

echo
echo -e "${GREEN}✓${NC} Secrets setup complete!"
echo
echo "Next steps:"
echo "1. Review and update API keys in secrets/ directory"
echo "2. Update .env.prod with your domain configuration"
echo "3. Set up SSL certificates (see secrets/ssl_*.pem.example)"
echo "4. Run: chmod 600 secrets/*.txt secrets/*.pem"
echo
echo "Security notes:"
echo "- Never commit secret files to version control"
echo "- Rotate secrets regularly"
echo "- Use strong, unique passwords for each service"
echo "- Store backups of secrets securely"