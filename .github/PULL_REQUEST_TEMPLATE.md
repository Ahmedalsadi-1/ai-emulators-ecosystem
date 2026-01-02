---
name: Pull Request
about: Submit changes to the Unified AI Ecosystem
title: '[PR] '
labels: []
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        ## 🔄 Pull Request
        Thanks for contributing to the Unified AI Ecosystem!

  - type: dropdown
    id: type
    attributes:
      label: Change Type
      description: What type of change is this?
      options:
        - feat (New feature)
        - fix (Bug fix)
        - docs (Documentation)
        - style (Code style)
        - refactor (Code refactoring)
        - test (Testing)
        - chore (Maintenance)
    validations:
      required: true

  - type: dropdown
    id: agent
    attributes:
      label: Agent Attribution
      description: Which agent implemented these changes?
      options:
        - Agent A (Test Infrastructure)
        - Agent B (Real-Time Integration)
        - Agent C (Advanced Systems)
        - Cross-Agent Changes
        - Infrastructure
        - Documentation
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Describe the changes made
      placeholder: What changes were made and why?
    validations:
      required: true

  - type: textarea
    id: testing
    attributes:
      label: Testing
      description: How have you tested these changes?
      placeholder: |
        - Unit tests: ✅
        - Integration tests: ✅
        - Property-based tests: ✅ (X iterations)
        - Manual testing: ✅
    validations:
      required: true

  - type: textarea
    id: breaking
    attributes:
      label: Breaking Changes
      description: Does this PR introduce breaking changes?
      placeholder: |
        - [ ] Breaking API changes
        - [ ] Database schema changes
        - [ ] Configuration changes
        - [ ] CLI interface changes

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      description: Please verify these requirements
      options:
        - label: Code follows the project's style guidelines
        - label: All tests pass (unit, integration, property-based)
        - label: Documentation updated if needed
        - label: Commit messages follow conventional format
        - label: Agent attribution included in commits
        - label: No sensitive information committed
        - label: Ready for review and merge

  - type: textarea
    id: related
    attributes:
      label: Related Issues
      description: Link to related issues or requirements
      placeholder: |
        - Closes #123
        - Addresses requirement R-456
        - Related to #789