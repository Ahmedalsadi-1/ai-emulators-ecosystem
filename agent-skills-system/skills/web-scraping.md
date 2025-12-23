---
category: data-collection
compatibility:
  agentTypes:
    - assistant
    - worker
  environments:
    - development
    - production
  platforms:
    - node
    - python
createdAt: 2025-12-20T08:22:26.086Z
dependencies: []
description: Extract data from web pages using various techniques
id: web-scraping
implementation:
  entryPoint: index.ts
  language: typescript
  runtime: node
  type: function
metadata:
  author: Agent Skills System
  category: data-collection
  changelog:
    - Initial web scraping skill
  difficulty: intermediate
  documentation: https://docs.example.com/web-scraping
  license: MIT
  maintainers:
    - system@example.com
  repository: https://github.com/example/web-scraping-skill
  stability: stable
  tags:
    - web
    - scraping
    - data
name: Web Scraping
outputs:
  - description: Extracted data
    name: data
    required: true
    type: object
parameters:
  - description: URL to scrape
    name: url
    required: true
    type: string
  - description: CSS selectors for data extraction
    name: selectors
    required: false
    type: object
prerequisites:
  - Basic programming knowledge
updatedAt: 2025-12-20T08:22:26.086Z
usage:
  bestPractices:
    - Respect robots.txt
    - Use reasonable request rates
  commonPatterns:
    - Pagination handling
    - Error recovery
  examples:
    - description: Extract article content from a news website
      expectedOutput:
        content: Article content...
        title: Article Title
      parameters:
        url: https://example.com/article
      tags:
        - basic
        - news
      title: Basic web scraping
  performance:
    averageExecutionTime: 2000
    memoryUsage: 100
    successRate: 95
  tutorials:
    - https://example.com/web-scraping-tutorial
version: 1.0.0
---

# Web Scraping Skill

This skill extracts data from web pages.