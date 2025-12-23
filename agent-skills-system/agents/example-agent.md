---
capabilities:
  domains:
    - general
    - web-development
  expertise:
    general: 5
    web-development: 4
  languages:
    - en
  limitations:
    - Cannot access external APIs without proper authentication
  preferredTools:
    - typescript
    - node
configuration:
  logging:
    includeSensitiveData: false
    level: info
    retentionDays: 30
  maxConcurrentTasks: 5
  resourceLimits:
    cpuLimit: 80
    memoryLimit: 512
    networkLimit: 1000
  retryPolicy:
    backoffMultiplier: 2
    backoffStrategy: exponential
    maxRetries: 3
  timeoutSettings:
    responseTimeout: 30
    skillTimeout: 60
    taskTimeout: 300
createdAt: 2025-12-20T08:22:26.086Z
id: example-agent
metadata:
  author: Agent Skills System
  category: assistant
  changelog:
    - Initial example agent
  description: Example agent profile demonstrating the system capabilities
  tags:
    - example
    - assistant
name: Example Agent
personality:
  adaptability: 7
  communicationStyle: conversational
  creativity: 6
  decisionMaking: analytical
  empathy: 8
  humor: 3
  traits:
    - helpful
    - precise
    - adaptable
skillProficiencies: {}
skills: []
updatedAt: 2025-12-20T08:22:26.086Z
version: 1.0.0
---

# Example Agent

This is an example agent profile.