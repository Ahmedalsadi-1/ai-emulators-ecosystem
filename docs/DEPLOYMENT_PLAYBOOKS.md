# AI Emulators Ecosystem - Deployment Playbooks

## Table of Contents

1. [Infrastructure Provisioning](#infrastructure-provisioning)
2. [Application Deployment](#application-deployment)
3. [Configuration Management](#configuration-management)
4. [Monitoring Setup](#monitoring-setup)
5. [Backup and Recovery](#backup-and-recovery)
6. [Maintenance Procedures](#maintenance-procedures)

## Infrastructure Provisioning

### AWS Infrastructure with Terraform

#### Main Terraform Configuration

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ai-ecosystem-terraform-state"
    key    = "infrastructure.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"

  name = "ai-ecosystem"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Environment = var.environment
    Project     = "ai-ecosystem"
  }
}

# ECS Cluster for containerized services
module "ecs" {
  source = "./modules/ecs"

  name = "ai-ecosystem"

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy = [
    {
      capacity_provider = "FARGATE"
      weight           = 1
      base            = 1
    }
  ]

  tags = {
    Environment = var.environment
  }
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"

  identifier = "ai-ecosystem-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  allocated_storage = 100
  storage_type      = "gp3"

  db_name  = "ai_ecosystem"
  username = "admin"
  port     = 5432

  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  performance_insights_enabled = true
  monitoring_interval         = 60

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"

  cluster_id      = "ai-ecosystem-${var.environment}"
  engine_version  = "7.0"
  node_type       = "cache.r6g.large"
  num_cache_nodes = 1

  parameter_group_name = "default.redis7"
  port                = 6379

  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.security_groups.redis_sg_id]

  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window   = "04:00-05:00"

  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name = "ai-ecosystem-${var.environment}"

  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.security_groups.alb_sg_id]

  target_groups = [
    {
      name             = "aios"
      backend_protocol = "HTTP"
      backend_port     = 8000
      target_type      = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }
    },
    {
      name             = "grafana"
      backend_protocol = "HTTP"
      backend_port     = 3000
      target_type      = "ip"
    }
  ]

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = module.acm.acm_certificate_arn
      target_group_index = 0
    }
  ]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = {
    Environment = var.environment
  }
}

# GPU-enabled EC2 instances for AI/ML workloads
module "gpu_instances" {
  source = "./modules/ec2"

  name = "ai-ecosystem-gpu-${var.environment}"

  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "g4dn.xlarge"
  key_name                    = var.key_name
  monitoring                  = true
  vpc_security_group_ids      = [module.security_groups.ec2_sg_id]
  subnet_id                   = element(module.vpc.private_subnets, 0)
  associate_public_ip_address = false

  root_block_device = [
    {
      volume_type = "gp3"
      volume_size = 100
      encrypted   = true
    }
  ]

  user_data = base64encode(templatefile("${path.module}/templates/gpu-setup.sh", {
    docker_compose_version = "v2.24.0"
  }))

  tags = {
    Environment = var.environment
    Service     = "gpu-compute"
  }
}
```

#### Variables Configuration

```hcl
# infrastructure/terraform/variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

#### GPU Instance Setup Script

```bash
#!/bin/bash
# infrastructure/templates/gpu-setup.sh

# Install NVIDIA drivers and Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/${docker_compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/ai-ecosystem
sudo chown ubuntu:ubuntu /opt/ai-ecosystem

# Setup GPU monitoring
nvidia-persistenced --user ubuntu
sudo systemctl enable nvidia-persistenced

echo "GPU instance setup complete"
```

### Ansible Playbooks for Configuration

#### Main Deployment Playbook

```yaml
# ansible/playbooks/deploy.yml
---
- name: Deploy AI Emulators Ecosystem
  hosts: all
  become: true
  vars_files:
    - ../vars/{{ environment }}.yml
    - ../vars/secrets.yml
  pre_tasks:
    - name: Update package cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install required packages
      package:
        name:
          - curl
          - wget
          - git
          - unzip
          - htop
          - jq
        state: present

  roles:
    - role: docker
    - role: monitoring
    - role: security
    - role: ai-ecosystem

  post_tasks:
    - name: Verify deployment
      command: docker-compose -f /opt/ai-ecosystem/docker-compose.yml ps
      register: compose_status
      failed_when: compose_status.rc != 0

    - name: Run health checks
      uri:
        url: "{{ item.url }}"
        method: GET
        status_code: 200
      loop:
        - { url: "http://localhost:8000/health" }
        - { url: "http://localhost:3000/api/health" }
      register: health_checks
      failed_when: health_checks.failed is defined

    - name: Print deployment summary
      debug:
        msg: |
          Deployment completed successfully!
          Services running: {{ compose_status.stdout_lines | length }}
          Health checks passed: {{ health_checks.results | selectattr('status', 'equalto', 200) | list | length }}
```

#### Docker Role

```yaml
# ansible/roles/docker/tasks/main.yml
---
- name: Install Docker dependencies
  package:
    name:
      - apt-transport-https
      - ca-certificates
      - curl
      - gnupg
      - lsb-release
    state: present

- name: Add Docker GPG key
  apt_key:
    url: https://download.docker.com/linux/ubuntu/gpg
    state: present

- name: Add Docker repository
  apt_repository:
    repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
    state: present
    filename: docker

- name: Install Docker
  package:
    name:
      - docker-ce
      - docker-ce-cli
      - containerd.io
      - docker-compose-plugin
    state: present

- name: Start Docker service
  service:
    name: docker
    state: started
    enabled: true

- name: Add user to docker group
  user:
    name: "{{ ansible_user }}"
    groups: docker
    append: true

- name: Install Docker Compose
  get_url:
    url: "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64"
    dest: /usr/local/bin/docker-compose
    mode: '0755'

# GPU support for AI instances
- name: Install NVIDIA Docker support
  block:
    - name: Add NVIDIA GPG key
      apt_key:
        url: https://nvidia.github.io/nvidia-docker/gpgkey
        state: present

    - name: Add NVIDIA Docker repository
      apt_repository:
        repo: "deb [arch=amd64] https://nvidia.github.io/nvidia-docker/ubuntu{{ ansible_distribution_release }}/$(lsb_release -cs) /"
        state: present
        filename: nvidia-docker

    - name: Install NVIDIA Docker
      package:
        name: nvidia-docker2
        state: present

    - name: Restart Docker
      service:
        name: docker
        state: restarted
  when: gpu_enabled | default(false)
```

#### AI Ecosystem Role

```yaml
# ansible/roles/ai-ecosystem/tasks/main.yml
---
- name: Create application directory
  file:
    path: /opt/ai-ecosystem
    state: directory
    owner: "{{ ansible_user }}"
    group: "{{ ansible_user }}"
    mode: '0755'

- name: Clone repository
  git:
    repo: "{{ ai_ecosystem_repo }}"
    dest: /opt/ai-ecosystem
    version: "{{ ai_ecosystem_version | default('main') }}"
    force: yes
  become_user: "{{ ansible_user }}"

- name: Copy environment configuration
  template:
    src: .env.j2
    dest: /opt/ai-ecosystem/.env
    owner: "{{ ansible_user }}"
    group: "{{ ansible_user }}"
    mode: '0600'

- name: Copy Docker Compose configuration
  template:
    src: docker-compose.yml.j2
    dest: /opt/ai-ecosystem/docker-compose.yml
    owner: "{{ ansible_user }}"
    group: "{{ ansible_user }}"
    mode: '0644'

- name: Create data directories
  file:
    path: "{{ item }}"
    state: directory
    owner: "{{ ansible_user }}"
    group: "{{ ansible_user }}"
    mode: '0755'
  loop:
    - /opt/ai-ecosystem/data
    - /opt/ai-ecosystem/logs
    - /opt/ai-ecosystem/backups

- name: Pull Docker images
  docker_compose:
    project_src: /opt/ai-ecosystem
    pull: yes
  become_user: "{{ ansible_user }}"

- name: Start services
  docker_compose:
    project_src: /opt/ai-ecosystem
    state: present
    restarted: "{{ restart_services | default(false) }}"
  become_user: "{{ ansible_user }}"

- name: Wait for services to be healthy
  uri:
    url: "{{ item.url }}"
    method: GET
    status_code: 200
  loop: "{{ health_checks }}"
  retries: 30
  delay: 10
  register: health_check_results
  failed_when: health_check_results.failed is defined
```

## Application Deployment

### Blue-Green Deployment Script

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

ENVIRONMENT=${1:-production}
NEW_VERSION=${2}
ROLLBACK=${3:-false}

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: $0 <environment> <version> [rollback]"
    exit 1
fi

# Configuration
APP_NAME="ai-ecosystem"
BLUE_STACK="${APP_NAME}-blue"
GREEN_STACK="${APP_NAME}-green"
DOCKER_REGISTRY="your-registry.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Determine active and inactive stacks
get_active_stack() {
    if docker stack ls | grep -q "${BLUE_STACK}"; then
        echo "$BLUE_STACK"
    elif docker stack ls | grep -q "${GREEN_STACK}"; then
        echo "$GREEN_STACK"
    else
        echo "$BLUE_STACK"  # Default to blue for first deployment
    fi
}

get_inactive_stack() {
    ACTIVE_STACK=$(get_active_stack)
    if [ "$ACTIVE_STACK" = "$BLUE_STACK" ]; then
        echo "$GREEN_STACK"
    else
        echo "$BLUE_STACK"
    fi
}

# Health check function
health_check() {
    local stack=$1
    local max_attempts=30
    local attempt=1

    log "Performing health checks for $stack..."

    while [ $attempt -le $max_attempts ]; do
        # Check if services are running
        if docker stack ps "$stack" --format "{{.Name}}: {{.CurrentState}}" | grep -q "Running"; then
            # Perform application health checks
            if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
                log "Health check passed for $stack"
                return 0
            fi
        fi

        warning "Health check failed (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    local from_stack=$1
    local to_stack=$2

    log "Rolling back from $from_stack to $to_stack"

    # Remove failed stack
    docker stack rm "$from_stack"

    # Switch traffic back to previous stack
    update_load_balancer "$to_stack"

    # Wait for rollback to complete
    sleep 30

    if health_check "$to_stack"; then
        log "Rollback completed successfully"
    else
        error "Rollback failed"
        exit 1
    fi
}

# Update load balancer
update_load_balancer() {
    local active_stack=$1

    log "Updating load balancer to route traffic to $active_stack"

    # Update nginx configuration or cloud load balancer
    # This would depend on your infrastructure setup
    if [ "$active_stack" = "$BLUE_STACK" ]; then
        # Route to blue stack
        sed -i 's/GREEN_IP/BLUE_IP/g' /etc/nginx/sites-available/ai-ecosystem
    else
        # Route to green stack
        sed -i 's/BLUE_IP/GREEN_IP/g' /etc/nginx/sites-available/ai-ecosystem
    fi

    # Reload nginx
    nginx -t && systemctl reload nginx
}

# Main deployment logic
main() {
    if [ "$ROLLBACK" = "true" ]; then
        log "Performing rollback..."

        ACTIVE_STACK=$(get_active_stack)
        INACTIVE_STACK=$(get_inactive_stack)

        rollback "$ACTIVE_STACK" "$INACTIVE_STACK"
        exit 0
    fi

    log "Starting blue-green deployment of version $NEW_VERSION to $ENVIRONMENT"

    ACTIVE_STACK=$(get_active_stack)
    INACTIVE_STACK=$(get_inactive_stack)

    log "Active stack: $ACTIVE_STACK"
    log "Inactive stack: $INACTIVE_STACK"

    # Deploy to inactive stack
    log "Deploying to $INACTIVE_STACK..."

    # Update docker-compose file with new version
    sed -i "s|image:.*ai-ecosystem:.*|image: $DOCKER_REGISTRY/ai-ecosystem:$NEW_VERSION|g" \
         docker-compose.${ENVIRONMENT}.yml

    # Deploy new version
    docker stack deploy -c docker-compose.${ENVIRONMENT}.yml "$INACTIVE_STACK"

    # Wait for deployment
    log "Waiting for deployment to complete..."
    sleep 60

    # Health check
    if ! health_check "$INACTIVE_STACK"; then
        error "Deployment failed health checks"
        rollback "$INACTIVE_STACK" "$ACTIVE_STACK"
        exit 1
    fi

    # Switch traffic
    log "Switching traffic to new version..."
    update_load_balancer "$INACTIVE_STACK"

    # Wait for traffic switch
    sleep 30

    # Final health check
    if ! health_check "$INACTIVE_STACK"; then
        error "Post-deployment health check failed"
        rollback "$INACTIVE_STACK" "$ACTIVE_STACK"
        exit 1
    fi

    # Remove old stack
    log "Removing old stack: $ACTIVE_STACK"
    docker stack rm "$ACTIVE_STACK"

    log "Deployment completed successfully!"
    log "New version $NEW_VERSION is now active on $INACTIVE_STACK"
}

# Run main function
main "$@"
```

### Rolling Update Script

```bash
#!/bin/bash
# scripts/rolling-update.sh

set -e

SERVICE_NAME=${1}
NEW_IMAGE=${2}
BATCH_SIZE=${3:-2}
WAIT_TIME=${4:-30}

if [ -z "$SERVICE_NAME" ] || [ -z "$NEW_IMAGE" ]; then
    echo "Usage: $0 <service-name> <new-image> [batch-size] [wait-time]"
    exit 1
fi

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Get current service configuration
CURRENT_CONFIG=$(docker service inspect "$SERVICE_NAME" --format '{{json .}}')

# Extract replica count
REPLICAS=$(echo "$CURRENT_CONFIG" | jq -r '.Spec.Mode.Replicated.Replicas')

log "Service $SERVICE_NAME has $REPLICAS replicas"
log "Updating in batches of $BATCH_SIZE"

# Calculate number of batches
BATCHES=$(( (REPLICAS + BATCH_SIZE - 1) / BATCH_SIZE ))

for ((batch=1; batch<=BATCHES; batch++)); do
    log "Processing batch $batch/$BATCHES"

    # Update service with new image
    docker service update \
        --image "$NEW_IMAGE" \
        --update-parallelism $BATCH_SIZE \
        --update-delay 10s \
        "$SERVICE_NAME"

    # Wait for batch to complete
    log "Waiting $WAIT_TIME seconds for batch to stabilize..."
    sleep $WAIT_TIME

    # Check service health
    UNHEALTHY=$(docker service ps "$SERVICE_NAME" --format '{{.CurrentState}}' | grep -v "Running" | wc -l)

    if [ "$UNHEALTHY" -gt 0 ]; then
        log "WARNING: $UNHEALTHY tasks are not healthy"

        # Check if this is acceptable (some tasks still updating)
        RUNNING=$(docker service ps "$SERVICE_NAME" --format '{{.CurrentState}}' | grep "Running" | wc -l)

        if [ "$RUNNING" -lt $((REPLICAS / 2)) ]; then
            log "ERROR: Too many unhealthy tasks, aborting update"
            exit 1
        fi
    else
        log "Batch $batch completed successfully"
    fi
done

log "Rolling update completed successfully"
```

## Configuration Management

### Ansible Vault for Secrets

```yaml
# ansible/group_vars/all/vault.yml
# Encrypted with: ansible-vault encrypt vault.yml

# Database credentials
database:
  password: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    66386439653...
  root_password: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    37326635393...

# API keys
api_keys:
  openai: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    61376363653...
  huggingface: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    32373739363...

# JWT secrets
jwt:
  secret: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    65303264333...

# SSL certificates
ssl:
  certificate: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    37343739353...
  private_key: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    64386439653...
```

### Environment-Specific Configurations

```yaml
# ansible/inventory/production
[ai-ecosystem]
prod-web-01 ansible_host=10.0.101.10 ansible_user=ubuntu
prod-web-02 ansible_host=10.0.101.11 ansible_user=ubuntu
prod-gpu-01 ansible_host=10.0.102.10 ansible_user=ubuntu
prod-db-01 ansible_host=10.0.103.10 ansible_user=ubuntu

[web]
prod-web-01
prod-web-02

[gpu]
prod-gpu-01

[database]
prod-db-01

[all:vars]
ansible_python_interpreter=/usr/bin/python3
environment=production
domain=ai-ecosystem.com

# Production-specific variables
aios_replicas=5
gpu_enabled=true
monitoring_enabled=true
backup_enabled=true
```

### Dynamic Inventory Script

```python
#!/usr/bin/env python3
# ansible/inventory/aws_ec2.py

import boto3
import json
import argparse

def get_instances_by_tag(tag_key, tag_value, region='us-east-1'):
    """Get EC2 instances by tag"""
    ec2 = boto3.client('ec2', region_name=region)

    response = ec2.describe_instances(
        Filters=[
            {
                'Name': f'tag:{tag_key}',
                'Values': [tag_value]
            },
            {
                'Name': 'instance-state-name',
                'Values': ['running']
            }
        ]
    )

    instances = []
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            instances.append({
                'instance_id': instance['InstanceId'],
                'private_ip': instance['PrivateIpAddress'],
                'public_ip': instance.get('PublicIpAddress'),
                'tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
            })

    return instances

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--host')
    args = parser.parse_args()

    if args.list:
        # Get all instances
        web_instances = get_instances_by_tag('Service', 'web')
        gpu_instances = get_instances_by_tag('Service', 'gpu')
        db_instances = get_instances_by_tag('Service', 'database')

        inventory = {
            '_meta': {
                'hostvars': {}
            },
            'web': {
                'hosts': [i['private_ip'] for i in web_instances],
                'vars': {
                    'ansible_user': 'ubuntu',
                    'service_type': 'web'
                }
            },
            'gpu': {
                'hosts': [i['private_ip'] for i in gpu_instances],
                'vars': {
                    'ansible_user': 'ubuntu',
                    'service_type': 'gpu',
                    'gpu_enabled': True
                }
            },
            'database': {
                'hosts': [i['private_ip'] for i in db_instances],
                'vars': {
                    'ansible_user': 'ubuntu',
                    'service_type': 'database'
                }
            },
            'all': {
                'vars': {
                    'environment': 'production',
                    'ansible_python_interpreter': '/usr/bin/python3'
                }
            }
        }

        # Add hostvars
        for instance in web_instances + gpu_instances + db_instances:
            inventory['_meta']['hostvars'][instance['private_ip']] = {
                'instance_id': instance['instance_id'],
                'public_ip': instance.get('public_ip'),
                'tags': instance['tags']
            }

        print(json.dumps(inventory, indent=2))

    elif args.host:
        # Return host-specific variables
        instances = get_instances_by_tag('Name', f'ai-ecosystem-{args.host}')
        if instances:
            instance = instances[0]
            hostvars = {
                'instance_id': instance['instance_id'],
                'public_ip': instance.get('public_ip'),
                'private_ip': instance['private_ip'],
                'tags': instance['tags']
            }
            print(json.dumps(hostvars, indent=2))
        else:
            print('{}')

if __name__ == '__main__':
    main()
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: production
    region: us-east-1

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # AIOS Service
  - job_name: 'aios'
    ec2_sd_configs:
      - region: us-east-1
        filters:
          - name: tag:Service
            values: [web]
          - name: tag:Environment
            values: [production]
    relabel_configs:
      - source_labels: [__meta_ec2_private_ip]
        target_label: __address__
        replacement: '${1}:8000'
    metrics_path: '/metrics'
    scrape_interval: 15s

  # GPU Instances
  - job_name: 'gpu-nodes'
    ec2_sd_configs:
      - region: us-east-1
        filters:
          - name: tag:Service
            values: [gpu]
    relabel_configs:
      - source_labels: [__meta_ec2_private_ip]
        target_label: __address__
        replacement: '${1}:9100'

  # Database
  - job_name: 'postgres'
    ec2_sd_configs:
      - region: us-east-1
        filters:
          - name: tag:Service
            values: [database]
    relabel_configs:
      - source_labels: [__meta_ec2_private_ip]
        target_label: __address__
        replacement: '${1}:9187'

  # Load Balancer
  - job_name: 'alb'
    aws_sd_configs:
      - region: us-east-1
        services: [elbv2]
    relabel_configs:
      - source_labels: [__meta_aws_elbv2_load_balancer]
        regex: '.*ai-ecosystem.*'
        action: keep

  # Docker Swarm
  - job_name: 'docker-swarm'
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    relabel_configs:
      - source_labels: [__meta_docker_container_name]
        regex: '/(.*)'
        target_label: container_name
```

### Grafana Dashboards as Code

```json
// monitoring/grafana/dashboards/overview.json
{
  "dashboard": {
    "title": "AI Ecosystem Production Overview",
    "tags": ["ai-ecosystem", "production"],
    "timezone": "UTC",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"aios|kali-desktop|gbox\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": { "text": "DOWN", "color": "red" },
                  "1": { "text": "UP", "color": "green" }
                }
              }
            ]
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (job)",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "title": "CPU Usage by Service",
        "type": "bargauge",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 }
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active connections"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 16 }
      },
      {
        "title": "MCP Tool Usage",
        "type": "table",
        "targets": [
          {
            "expr": "increase(mcp_tool_calls_total[1h])",
            "legendFormat": "{{tool_name}}"
          }
        ],
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 16 }
      },
      {
        "title": "Error Rate by Service",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "{{job}} 5xx rate"
          }
        ],
        "gridPos": { "h": 8, "w": 24, "x": 0, "y": 24 }
      }
    ]
  }
}
```

## Backup and Recovery

### Automated Backup Playbook

```yaml
# ansible/playbooks/backup.yml
---
- name: Backup AI Ecosystem Data
  hosts: database,gpu
  become: true
  vars:
    backup_dir: "/opt/ai-ecosystem/backups"
    retention_days: 7

  tasks:
    - name: Create backup directory
      file:
        path: "{{ backup_dir }}"
        state: directory
        mode: '0755'

    - name: Backup PostgreSQL database
      block:
        - name: Stop dependent services
          docker_compose:
            project_src: /opt/ai-ecosystem
            services: "{{ dependent_services }}"
            state: stopped
          when: inventory_hostname in groups['database']

        - name: Create database backup
          docker_compose:
            project_src: /opt/ai-ecosystem
            services: postgres
            command: pg_dumpall -U admin > "{{ backup_dir }}/db_backup_{{ ansible_date_time.iso8601 }}.sql"
          when: inventory_hostname in groups['database']

        - name: Restart dependent services
          docker_compose:
            project_src: /opt/ai-ecosystem
            services: "{{ dependent_services }}"
            state: started
          when: inventory_hostname in groups['database']
      when: inventory_hostname in groups['database']

    - name: Backup model files
      archive:
        path: /opt/ai-ecosystem/models
        dest: "{{ backup_dir }}/models_backup_{{ ansible_date_time.iso8601 }}.tar.gz"
        format: gz
      when: inventory_hostname in groups['gpu']

    - name: Upload backups to S3
      aws_s3:
        bucket: "{{ backup_bucket }}"
        object: "backups/{{ ansible_date_time.iso8601 }}/{{ inventory_hostname }}/"
        src: "{{ backup_dir }}/"
        mode: put
        aws_access_key: "{{ aws_access_key }}"
        aws_secret_key: "{{ aws_secret_key }}"

    - name: Clean old backups
      find:
        paths: "{{ backup_dir }}"
        age: "{{ retention_days }}d"
        recurse: yes
      register: old_backups

    - name: Remove old backup files
      file:
        path: "{{ item.path }}"
        state: absent
      loop: "{{ old_backups.files }}"
```

### Disaster Recovery Playbook

```yaml
# ansible/playbooks/disaster-recovery.yml
---
- name: Disaster Recovery for AI Ecosystem
  hosts: all
  become: true
  vars:
    recovery_mode: "{{ recovery_mode | default('full') }}"

  pre_tasks:
    - name: Check if backup exists
      aws_s3:
        bucket: "{{ backup_bucket }}"
        object: "{{ recovery_backup_key }}"
        mode: get
        dest: /tmp/backup_info.json
      register: backup_check
      failed_when: backup_check.failed

    - name: Load backup metadata
      include_vars:
        file: /tmp/backup_info.json
        name: backup_info

  tasks:
    - name: Stop all services
      docker_compose:
        project_src: /opt/ai-ecosystem
        state: absent
      ignore_errors: yes

    - name: Clean Docker volumes (full recovery only)
      docker_volume:
        name: "{{ item }}"
        state: absent
      loop: "{{ docker_volumes_to_clean }}"
      when: recovery_mode == 'full'

    - name: Download backups from S3
      aws_s3:
        bucket: "{{ backup_bucket }}"
        object: "{{ recovery_backup_key }}"
        dest: "{{ recovery_temp_dir }}"
        mode: get

    - name: Restore database
      block:
        - name: Start PostgreSQL container
          docker_compose:
            project_src: /opt/ai-ecosystem
            services: postgres
            state: present

        - name: Wait for database to be ready
          wait_for:
            host: localhost
            port: 5432
            delay: 10
            timeout: 300

        - name: Restore database from backup
          shell: |
            docker exec -i ai-ecosystem_postgres_1 psql -U admin -d postgres < {{ recovery_temp_dir }}/db_backup.sql
      when: inventory_hostname in groups['database']

    - name: Restore model files
      unarchive:
        src: "{{ recovery_temp_dir }}/models_backup.tar.gz"
        dest: /opt/ai-ecosystem
        remote_src: yes
      when: inventory_hostname in groups['gpu']

    - name: Restore configuration files
      copy:
        src: "{{ recovery_temp_dir }}/config/"
        dest: /opt/ai-ecosystem/
        remote_src: yes

    - name: Start services
      docker_compose:
        project_src: /opt/ai-ecosystem
        state: present

    - name: Verify recovery
      uri:
        url: "{{ item.url }}"
        method: GET
        status_code: 200
        timeout: 30
      loop: "{{ health_checks }}"
      register: recovery_checks
      failed_when: recovery_checks.failed is defined

    - name: Send recovery notification
      slack:
        token: "{{ slack_token }}"
        msg: |
          🚨 AI Ecosystem Recovery Completed

          Environment: {{ environment }}
          Recovery Mode: {{ recovery_mode }}
          Services Restored: {{ recovery_checks.results | selectattr('status', 'equalto', 200) | list | length }}
          Timestamp: {{ ansible_date_time.iso8601 }}
      when: slack_token is defined

  post_tasks:
    - name: Clean up temporary files
      file:
        path: "{{ recovery_temp_dir }}"
        state: absent

    - name: Log recovery completion
      lineinfile:
        path: /var/log/ai-ecosystem/recovery.log
        line: "{{ ansible_date_time.iso8601 }}: Recovery completed - {{ recovery_mode }} mode"
        create: yes
```

## Maintenance Procedures

### Service Restart Procedure

```bash
#!/bin/bash
# scripts/maintenance/restart-services.sh

SERVICES=("postgres" "redis" "aios" "gbox" "bytebot" "open-interface" "factif-ai" "postiz-app" "onlysnarf" "reels-clips-automator" "wan2gp")
MAINTENANCE_MODE=${1:-rolling}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Enable maintenance mode
enable_maintenance() {
    log "Enabling maintenance mode..."
    # Update load balancer to show maintenance page
    # Send notifications to users
    curl -X POST https://api.pagerduty.com/maintenance \
         -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
         -d "maintenance[description]=Scheduled maintenance"
}

# Disable maintenance mode
disable_maintenance() {
    log "Disabling maintenance mode..."
    # Restore normal load balancer configuration
    # Send service restored notifications
}

# Rolling restart (default)
rolling_restart() {
    log "Performing rolling restart..."

    for service in "${SERVICES[@]}"; do
        log "Restarting $service..."

        # Check if service exists and is running
        if docker-compose ps | grep -q "$service"; then
            # Graceful stop
            docker-compose stop "$service"

            # Wait for connections to drain
            sleep 30

            # Start service
            docker-compose start "$service"

            # Health check
            if [ "$service" = "aios" ]; then
                for i in {1..30}; do
                    if curl -f -s http://localhost:8000/health > /dev/null; then
                        log "$service is healthy"
                        break
                    fi
                    sleep 10
                done
            fi

            # Brief pause between services
            sleep 5
        else
            log "Service $service is not running, skipping..."
        fi
    done
}

# Full restart
full_restart() {
    log "Performing full restart..."

    # Stop all services
    docker-compose down

    # Start all services
    docker-compose up -d

    # Wait for startup
    log "Waiting for services to start..."
    sleep 120

    # Health checks
    log "Performing health checks..."
    ./scripts/health-check.sh
}

# Main logic
case $MAINTENANCE_MODE in
    "rolling")
        rolling_restart
        ;;
    "full")
        enable_maintenance
        full_restart
        disable_maintenance
        ;;
    *)
        echo "Usage: $0 [rolling|full]"
        exit 1
        ;;
esac

log "Maintenance completed successfully"
```

### Log Rotation and Cleanup

```yaml
# ansible/playbooks/log-maintenance.yml
---
- name: Log Maintenance and Rotation
  hosts: all
  become: true

  tasks:
    - name: Rotate application logs
      include_role:
        name: logrotate
      vars:
        logrotate_configs:
          - name: ai-ecosystem
            path: /opt/ai-ecosystem/logs/*.log
            options:
              - rotate 7
              - daily
              - missingok
              - compress
              - delaycompress
              - notifempty
              - create 644 ubuntu ubuntu
            postrotate: docker-compose -f /opt/ai-ecosystem/docker-compose.yml restart aios

    - name: Clean old Docker images
      docker_prune:
        images: true
        images_filters:
          dangling: true
        build: true

    - name: Clean old Docker containers
      docker_prune:
        containers: true
        containers_filters:
          until: 24h

    - name: Clean old Docker volumes (optional)
      docker_prune:
        volumes: true
        volumes_filters:
          label:
            - "ai-ecosystem.cleanup=true"

    - name: Rotate system logs
      command: logrotate -f /etc/logrotate.conf
      ignore_errors: yes

    - name: Clean package cache
      apt:
        autoclean: yes
        autoremove: yes
      when: ansible_os_family == "Debian"

    - name: Clean temporary files
      file:
        path: "{{ item }}"
        state: absent
      loop:
        - /tmp/*
        - /var/tmp/*
      ignore_errors: yes
```

### Security Updates

```bash
#!/bin/bash
# scripts/maintenance/security-updates.sh

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check for security updates
check_security_updates() {
    log "Checking for security updates..."

    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        SECURITY_UPDATES=$(apt-get --just-print upgrade | grep "Inst" | grep -i security | wc -l)
    elif command -v yum &> /dev/null; then
        SECURITY_UPDATES=$(yum check-update --security | grep "needed" | wc -l)
    else
        log "Unsupported package manager"
        exit 1
    fi

    echo "Found $SECURITY_UPDATES security updates"
}

# Apply security updates
apply_security_updates() {
    log "Applying security updates..."

    # Enable maintenance mode
    ./scripts/maintenance/enable-maintenance.sh

    if command -v apt-get &> /dev/null; then
        sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
    elif command -v yum &> /dev/null; then
        sudo yum update -y --security
    fi

    # Restart services if needed
    ./scripts/maintenance/restart-services.sh rolling

    # Disable maintenance mode
    ./scripts/maintenance/disable-maintenance.sh

    log "Security updates applied successfully"
}

# Check for vulnerable packages
check_vulnerabilities() {
    log "Checking for vulnerabilities..."

    # Install vulnerability scanner if not present
    if ! command -v grype &> /dev/null; then
        curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
    fi

    # Scan Docker images
    for image in $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep ai-ecosystem); do
        log "Scanning $image..."
        grype "$image" --fail-on high > /tmp/vulnerability-scan.txt

        if [ $? -eq 0 ]; then
            log "$image: No high-severity vulnerabilities found"
        else
            log "$image: High-severity vulnerabilities found!"
            cat /tmp/vulnerability-scan.txt
        fi
    done
}

# Main execution
main() {
    check_security_updates
    check_vulnerabilities

    if [ "$1" = "--apply" ]; then
        apply_security_updates
    else
        log "Run with --apply to install updates"
    fi
}

main "$@"
```

---

These deployment playbooks provide comprehensive infrastructure provisioning, application deployment, configuration management, monitoring setup, backup and recovery procedures, and maintenance operations for the AI Emulators Ecosystem.