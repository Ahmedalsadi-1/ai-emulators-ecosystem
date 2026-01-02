# Security Prompts

## Comprehensive Security Implementation for AI Emulators Ecosystem

This collection provides specialized prompts for security audits, authentication implementation, authorization patterns, API security, and vulnerability assessments across the microservices ecosystem.

---

### 1. Comprehensive Security Audit and Vulnerability Assessment

**Context**: Conduct a systematic security audit of all microservices, infrastructure, and applications in the AI Emulators Ecosystem to identify and address security vulnerabilities.

**Objective**: Perform comprehensive security assessment covering application security, infrastructure security, data protection, and compliance requirements.

**Step-by-Step Instructions**:
1. **Security Assessment Planning**
   - Define scope and objectives for security audit
   - Identify all assets, services, and data flows
   - Establish security assessment methodology and criteria
   - Plan vulnerability scanning and penetration testing approach

2. **Automated Security Scanning**
   - Run automated vulnerability scanners on all services
   - Scan dependencies for known security vulnerabilities
   - Perform static code analysis for security issues
   - Configure container and infrastructure security scanning

3. **Manual Security Testing**
   - Conduct penetration testing on critical services
   - Test authentication and authorization mechanisms
   - Validate input sanitization and injection prevention
   - Test session management and security controls

4. **Security Gap Analysis and Remediation**
   - Document identified security vulnerabilities and risks
   - Prioritize remediation based on severity and impact
   - Implement security fixes and improvements
   - Validate security improvements and residual risks

**Deliverables**:
- Comprehensive security audit report
- Vulnerability assessment results and remediation plan
- Security improvement implementation
- Security monitoring and alerting setup
- Security documentation and best practices guide

**Quality Validation Criteria**:
- All identified vulnerabilities documented with severity ratings
- High-severity vulnerabilities remediated within defined timeframes
- Security scanning integrated into CI/CD pipeline
- Security monitoring provides real-time threat detection
- Security improvements validated through retesting

**Integration with Ecosystem Patterns**:
- Follow established security patterns from AGENTS.md
- Use consistent security logging and monitoring
- Integrate with existing authentication and authorization
- Align with deployment and infrastructure security practices

---

### 2. Authentication System Implementation

**Context**: Design and implement robust authentication mechanisms across all microservices to ensure secure user and service identity verification.

**Objective**: Create comprehensive authentication system that supports multiple authentication methods, maintains security standards, and integrates with the ecosystem.

**Step-by-Step Instructions**:
1. **Authentication Architecture Design**
   - Design centralized authentication service architecture
   - Define authentication methods (JWT, OAuth2, API keys, etc.)
   - Plan token lifecycle management and refresh strategies
   - Design authentication flow for different service types

2. **Authentication Implementation**
   - Implement JWT-based authentication with proper claims
   - Configure OAuth2/OpenID Connect integration
   - Implement API key authentication for service-to-service
   - Add multi-factor authentication support

3. **Token Management and Security**
   - Implement secure token generation and validation
   - Configure token expiration and refresh mechanisms
   - Implement token revocation and blacklisting
   - Add token encryption and secure storage

4. **Authentication Monitoring and Auditing**
   - Implement authentication logging and monitoring
   - Set up authentication failure alerting
   - Add authentication audit trails
   - Regular authentication security reviews

**Deliverables**:
- Authentication system architecture design
- Authentication service implementation
- Token management and security mechanisms
- Authentication monitoring and auditing setup
- Authentication security documentation

**Quality Validation Criteria**:
- All authentication methods properly implemented and tested
- Token security meets industry standards
- Authentication failures properly handled and logged
- No authentication bypass vulnerabilities
- Performance impact minimized for authentication operations

**Integration with Ecosystem Patterns**:
- Follow established authentication patterns
- Use consistent security logging and monitoring
- Integrate with existing authorization systems
- Align with deployment and scaling strategies

---

### 3. Authorization and Access Control Implementation

**Context**: Implement comprehensive authorization and access control systems across all microservices to ensure proper resource access management.

**Objective**: Create role-based and attribute-based access control systems that provide granular permission management and enforce security policies.

**Step-by-Step Instructions**:
1. **Authorization Architecture Design**
   - Design centralized authorization service architecture
   - Define access control models (RBAC, ABAC, DAC)
   - Plan permission inheritance and delegation strategies
   - Design authorization decision points and enforcement

2. **Role-Based Access Control Implementation**
   - Define roles and permission hierarchies
   - Implement role assignment and management
   - Configure permission checking mechanisms
   - Add role-based resource access control

3. **Attribute-Based Access Control Implementation**
   - Define attribute-based authorization policies
   - Implement context-aware access decisions
   - Configure dynamic permission evaluation
   - Add attribute-based resource filtering

4. **Authorization Security and Auditing**
   - Implement secure authorization decision caching
   - Add authorization audit trails and logging
   - Configure authorization failure monitoring
   - Regular authorization policy reviews and updates

**Deliverables**:
- Authorization architecture and policy design
- RBAC and ABAC implementation
- Authorization monitoring and auditing setup
- Security policy documentation
- Authorization security validation report

**Quality Validation Criteria**:
- Authorization policies properly enforce access control
- No unauthorized access possible through any path
- Authorization decisions are consistent and reliable
- Authorization performance meets service requirements
- Security policies properly documented and tested

**Integration with Ecosystem Patterns**:
- Follow established authorization patterns
- Use consistent security logging and monitoring
- Integrate with existing authentication systems
- Align with deployment and service communication patterns

---

### 4. API Security Implementation

**Context**: Implement comprehensive API security measures across all microservices to protect against common API vulnerabilities and attacks.

**Objective**: Create secure API implementations that prevent injection attacks, ensure data validation, and maintain API security standards.

**Step-by-Step Instructions**:
1. **API Security Design**
   - Define API security requirements and standards
   - Design secure API communication protocols
   - Plan API rate limiting and throttling strategies
   - Design API security monitoring and alerting

2. **Input Validation and Sanitization**
   - Implement comprehensive input validation
   - Add input sanitization to prevent injection attacks
   - Configure parameter validation and type checking
   - Implement secure query parameter handling

3. **API Protection Mechanisms**
   - Implement API rate limiting and throttling
   - Add API request/response validation
   - Configure secure API communication (HTTPS, headers)
   - Implement API security headers and CORS policies

4. **API Security Monitoring and Testing**
   - Implement API security logging and monitoring
   - Add API security testing and validation
   - Configure API security alerting and incident response
   - Regular API security reviews and updates

**Deliverables**:
- API security architecture and implementation
- Input validation and sanitization systems
- API protection and monitoring mechanisms
- API security testing and validation
- API security documentation and best practices

**Quality Validation Criteria**:
- All API endpoints properly validated and secured
- No injection vulnerabilities in API implementations
- API rate limiting prevents abuse and DoS attacks
- API security monitoring detects threats in real-time
- API security improvements validated through testing

**Integration with Ecosystem Patterns**:
- Follow established API security patterns
- Use consistent security logging and monitoring
- Integrate with existing authentication and authorization
- Align with deployment and scaling strategies

---

### 5. Data Protection and Encryption Implementation

**Context**: Implement comprehensive data protection and encryption strategies across all services to ensure data confidentiality and integrity.

**Objective**: Create secure data handling practices that protect sensitive data at rest and in transit while maintaining regulatory compliance.

**Step-by-Step Instructions**:
1. **Data Classification and Protection Planning**
   - Classify data based on sensitivity and regulatory requirements
   - Define data protection requirements for each classification
   - Plan encryption strategies for data at rest and in transit
   - Design secure key management and rotation

2. **Encryption Implementation**
   - Implement encryption for data at rest (databases, files)
   - Configure encryption for data in transit (TLS, HTTPS)
   - Add field-level encryption for sensitive data
   - Implement secure key storage and management

3. **Data Loss Prevention**
   - Implement data masking and tokenization
   - Configure secure data backup and recovery
   - Add data retention and deletion policies
   - Implement data access logging and monitoring

4. **Compliance and Auditing**
   - Implement compliance monitoring for data protection
   - Add data protection audit trails and reporting
   - Configure data breach detection and response
   - Regular data protection reviews and updates

**Deliverables**:
- Data classification and protection strategy
- Encryption implementation for all data types
- Data loss prevention mechanisms
- Compliance monitoring and auditing setup
- Data protection documentation and procedures

**Quality Validation Criteria**:
- All sensitive data properly encrypted at rest and in transit
- Data access controls properly enforced
- Data loss prevention mechanisms tested and validated
- Compliance requirements met for all data types
- Data protection monitoring provides effective oversight

**Integration with Ecosystem Patterns**:
- Follow established data protection patterns
- Use consistent encryption and key management
- Integrate with existing security monitoring
- Align with regulatory compliance requirements

---

### 6. Infrastructure Security Hardening

**Context**: Implement comprehensive infrastructure security hardening across all services and deployment environments to prevent security breaches.

**Objective**: Create secure infrastructure configurations that follow security best practices and prevent common infrastructure attacks.

**Step-by-Step Instructions**:
1. **Infrastructure Security Assessment**
   - Audit current infrastructure security configurations
   - Identify security vulnerabilities in infrastructure setup
   - Assess network security and segmentation
   - Document infrastructure security baseline

2. **Security Configuration Implementation**
   - Harden operating system and container configurations
   - Implement secure network configurations and firewalls
   - Configure secure SSH and remote access
   - Add security monitoring and intrusion detection

3. **Access Control and Privilege Management**
   - Implement principle of least privilege access
   - Configure secure service account management
   - Add privilege escalation prevention
   - Implement secure configuration management

4. **Security Monitoring and Incident Response**
   - Implement infrastructure security monitoring
   - Add security event logging and alerting
   - Configure incident response procedures
   - Regular infrastructure security reviews and updates

**Deliverables**:
- Infrastructure security assessment report
- Security hardening implementation
- Access control and privilege management setup
- Security monitoring and incident response
- Infrastructure security documentation

**Quality Validation Criteria**:
- All infrastructure properly hardened and secured
- Access controls follow principle of least privilege
- Security monitoring detects threats effectively
- Incident response procedures tested and validated
- Infrastructure security improvements documented

**Integration with Ecosystem Patterns**:
- Follow established infrastructure security patterns
- Use consistent security monitoring and logging
- Integrate with existing deployment and scaling
- Align with compliance and audit requirements

---

### 7. Container and Orchestration Security

**Context**: Implement comprehensive security measures for containerized applications and orchestration platforms in the microservices ecosystem.

**Objective**: Create secure container and orchestration configurations that prevent container escapes, image vulnerabilities, and orchestration attacks.

**Step-by-Step Instructions**:
1. **Container Security Assessment**
   - Audit container images for vulnerabilities
   - Assess container runtime security configurations
   - Review orchestration platform security settings
   - Document container security baseline

2. **Image Security and Management**
   - Implement secure image building and scanning
   - Configure image signing and verification
   - Add vulnerability scanning in CI/CD pipeline
   - Implement image registry security

3. **Runtime Security Implementation**
   - Configure container runtime security policies
   - Implement network policies and isolation
   - Add resource limits and security constraints
   - Configure security contexts and capabilities

4. **Orchestration Security**
   - Harden orchestration platform configurations
   - Implement RBAC for orchestration access
   - Add network segmentation and policies
   - Configure secure service mesh and ingress

**Deliverables**:
- Container security assessment and hardening plan
- Secure image building and scanning implementation
- Runtime security policies and monitoring
- Orchestration security configuration
- Container security documentation and procedures

**Quality Validation Criteria**:
- All container images free from high-severity vulnerabilities
- Runtime security policies properly enforced
- Orchestration platform properly secured and hardened
- Container security monitoring provides effective oversight
- Security improvements validated through testing

**Integration with Ecosystem Patterns**:
- Follow established container security patterns
- Use consistent security monitoring and logging
- Integrate with existing CI/CD security practices
- Align with deployment and scaling strategies

---

### 8. Security Monitoring and Incident Response

**Context**: Implement comprehensive security monitoring and incident response capabilities to detect, respond to, and recover from security incidents.

**Objective**: Create proactive security monitoring that detects threats early and enables effective incident response and recovery.

**Step-by-Step Instructions**:
1. **Security Monitoring Architecture**
   - Design centralized security monitoring architecture
   - Define security events and alerting criteria
   - Plan security data collection and correlation
   - Design security dashboard and reporting

2. **Security Event Detection**
   - Implement security event collection from all services
   - Configure correlation rules for threat detection
   - Add anomaly detection for unusual behavior
   - Implement threat intelligence integration

3. **Incident Response Implementation**
   - Define incident response procedures and playbooks
   - Implement automated incident detection and alerting
   - Add incident escalation and notification systems
   - Configure incident tracking and documentation

4. **Recovery and Post-Incident Analysis**
   - Implement security incident recovery procedures
   - Add post-incident analysis and lessons learned
   - Configure security improvement recommendations
   - Regular incident response testing and updates

**Deliverables**:
- Security monitoring architecture and implementation
- Threat detection and alerting systems
- Incident response procedures and automation
- Security incident tracking and reporting
- Security monitoring documentation and procedures

**Quality Validation Criteria**:
- Security monitoring detects threats within defined timeframes
- Incident response procedures enable effective threat mitigation
- Security incidents properly documented and analyzed
- Recovery procedures tested and validated
- Security monitoring provides actionable intelligence

**Integration with Ecosystem Patterns**:
- Follow established security monitoring patterns
- Use consistent logging and alerting strategies
- Integrate with existing service monitoring
- Align with deployment and operational practices

---

### 9. Secrets Management and Configuration Security

**Context**: Implement secure secrets management and configuration practices to prevent credential leaks and unauthorized access.

**Objective**: Create comprehensive secrets management that secures all sensitive configuration data and credentials across the ecosystem.

**Step-by-Step Instructions**:
1. **Secrets Inventory and Management Strategy**
   - Catalog all secrets and sensitive configuration data
   - Define secrets management requirements and policies
   - Plan secrets rotation and lifecycle management
   - Design secure secrets storage and access

2. **Secrets Management Implementation**
   - Implement centralized secrets management system
   - Configure secure secrets storage and encryption
   - Add secrets access controls and auditing
   - Implement secrets rotation and updating

3. **Configuration Security**
   - Secure configuration management and storage
   - Implement configuration validation and integrity checking
   - Add configuration encryption for sensitive values
   - Configure secure configuration deployment

4. **Secrets Monitoring and Auditing**
   - Implement secrets access monitoring and alerting
   - Add secrets usage auditing and reporting
   - Configure secrets leak detection
   - Regular secrets management reviews and updates

**Deliverables**:
- Secrets inventory and management strategy
- Centralized secrets management implementation
- Configuration security and encryption
- Secrets monitoring and auditing systems
- Secrets management documentation and procedures

**Quality Validation Criteria**:
- All secrets properly managed and secured
- No secrets stored in plaintext or version control
- Secrets access properly controlled and audited
- Configuration security prevents unauthorized access
- Secrets management practices validated and tested

**Integration with Ecosystem Patterns**:
- Follow established secrets management patterns
- Use consistent security monitoring and logging
- Integrate with existing deployment and configuration
- Align with compliance and audit requirements

---

### 10. Compliance and Security Standards Implementation

**Context**: Implement security compliance measures and standards adherence across the microservices ecosystem to meet regulatory requirements.

**Objective**: Create compliance framework that ensures adherence to security standards and regulatory requirements while maintaining operational efficiency.

**Step-by-Step Instructions**:
1. **Compliance Assessment and Planning**
   - Assess current compliance status and gaps
   - Identify applicable security standards and regulations
   - Plan compliance implementation strategy
   - Define compliance monitoring and reporting

2. **Security Standards Implementation**
   - Implement required security controls and measures
   - Add compliance checking and validation
   - Configure security policy enforcement
   - Implement security standards auditing

3. **Compliance Monitoring and Reporting**
   - Implement compliance monitoring and alerting
   - Add compliance reporting and documentation
   - Configure automated compliance checking
   - Regular compliance reviews and updates

4. **Audit Preparation and Management**
   - Prepare for security audits and assessments
   - Implement audit trail and evidence collection
   - Add audit response and remediation procedures
   - Maintain compliance documentation and records

**Deliverables**:
- Compliance assessment and implementation plan
- Security standards implementation
- Compliance monitoring and reporting systems
- Audit preparation and management procedures
- Compliance documentation and evidence

**Quality Validation Criteria**:
- All applicable compliance requirements implemented
- Compliance monitoring provides effective oversight
- Audit readiness maintained and validated
- Compliance gaps properly addressed and remediated
- Compliance documentation complete and accurate

**Integration with Ecosystem Patterns**:
- Follow established compliance patterns
- Use consistent security monitoring and reporting
- Integrate with existing security and operational practices
- Align with regulatory and business requirements

---

### 11. Third-Party Integration Security

**Context**: Implement security measures for third-party integrations and external service dependencies to prevent supply chain attacks and data breaches.

**Objective**: Create secure integration practices that validate and monitor third-party services while maintaining security standards.

**Step-by-Step Instructions**:
1. **Third-Party Security Assessment**
   - Assess security posture of all third-party integrations
   - Evaluate vendor security practices and certifications
   - Review API security and data handling practices
   - Document third-party security risks and dependencies

2. **Secure Integration Implementation**
   - Implement secure API communication with third parties
   - Add input validation for third-party data
   - Configure secure credential management for integrations
   - Implement integration monitoring and alerting

3. **Supply Chain Security**
   - Implement dependency scanning and vulnerability management
   - Add supply chain security monitoring
   - Configure secure package and library management
   - Implement software bill of materials (SBOM) tracking

4. **Integration Monitoring and Response**
   - Implement third-party integration monitoring
   - Add security event correlation and analysis
   - Configure incident response for third-party security issues
   - Regular third-party security reviews and updates

**Deliverables**:
- Third-party security assessment report
- Secure integration implementation
- Supply chain security measures
- Integration monitoring and incident response
- Third-party security documentation and procedures

**Quality Validation Criteria**:
- All third-party integrations properly secured and validated
- Supply chain vulnerabilities identified and addressed
- Integration monitoring detects security issues effectively
- Incident response procedures tested for third-party scenarios
- Security improvements validated through monitoring

**Integration with Ecosystem Patterns**:
- Follow established integration security patterns
- Use consistent security monitoring and logging
- Integrate with existing security and operational practices
- Align with compliance and risk management requirements

---

### 12. Security Testing and Validation Framework

**Context**: Implement comprehensive security testing framework to validate security implementations and prevent security regressions.

**Objective**: Create automated security testing that validates all security controls and ensures consistent security posture across deployments.

**Step-by-Step Instructions**:
1. **Security Testing Strategy Design**
   - Define security testing scope and objectives
   - Identify critical security scenarios and use cases
   - Establish security testing standards and criteria
   - Design security test automation framework

2. **Automated Security Testing Implementation**
   - Implement security scanning in CI/CD pipeline
   - Add dynamic security testing (DAST) for applications
   - Configure dependency vulnerability scanning
   - Implement infrastructure security testing

3. **Security Test Execution and Validation**
   - Execute comprehensive security test suites
   - Validate security controls and implementations
   - Test security incident response procedures
   - Perform security regression testing

4. **Security Testing Monitoring and Improvement**
   - Monitor security test results and trends
   - Implement security test reporting and alerting
   - Regular security testing reviews and updates
   - Continuous improvement of security testing coverage

**Deliverables**:
- Security testing framework implementation
- Automated security test suites
- Security test execution and validation reports
- Security testing monitoring and alerting
- Security testing documentation and procedures

**Quality Validation Criteria**:
- Security tests cover all critical security scenarios
- Security testing integrated with CI/CD pipeline
- Security regressions detected automatically
- Security test results provide actionable insights
- Security testing continuously improved and updated

**Integration with Ecosystem Patterns**:
- Follow established testing patterns
- Use consistent monitoring and reporting
- Integrate with existing CI/CD and quality processes
- Align with security and compliance requirements

---

## Quality Assurance Guidelines

### Security Standards
- All security controls implemented and tested
- No high-severity vulnerabilities in production
- Security monitoring provides real-time threat detection
- Incident response procedures tested and validated
- Compliance requirements met for all applicable standards

### Security Monitoring Requirements
- Real-time security event monitoring for all critical assets
- Security alerting with appropriate severity levels
- Security incident tracking and response
- Compliance monitoring and reporting
- Regular security assessment and improvement cycles

### Integration Standards
- All security implementations integrate with existing ecosystem patterns
- Consistent security logging and monitoring across all services
- Security controls do not impact functionality or performance
- Security practices align with compliance requirements
- Security improvements validated through testing and monitoring

This comprehensive security prompt collection ensures systematic implementation of security controls across the entire AI Emulators Ecosystem while maintaining functionality, performance, and regulatory compliance.