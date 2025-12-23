"""
End-to-End User Workflow Tests

Comprehensive E2E tests that simulate complete user journeys from authentication
through various workflows to completion, covering the entire unified ecosystem.
"""

import pytest
import asyncio
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any, List, Optional
import aiohttp
import websockets
import redis
from playwright.async_api import Browser, Page, BrowserContext

# Import shared testing utilities
from testing_utils import (
    generate_test_user,
    generate_test_agent,
    generate_test_workflow,
    mock_auth_service,
    wait_for_service,
    setup_test_database,
)


class TestUserOnboardingWorkflow:
    """Test complete user onboarding workflow"""

    @pytest.fixture
    async def browser_context(self):
        """Browser context for E2E testing"""
        from playwright.async_api import async_playwright

        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch()
        context = await browser.new_context()

        # Set up context with test user session
        await context.add_cookies([{
            'name': 'session_token',
            'value': 'test-session-token-123',
            'domain': 'localhost',
            'path': '/',
        }])

        yield context

        await context.close()
        await browser.close()

    @pytest.mark.asyncio
    async def test_complete_user_registration_and_onboarding(self, browser_context):
        """Test complete user registration and onboarding flow"""
        page = await browser_context.new_page()

        try:
            # Step 1: Navigate to registration page
            await page.goto('http://localhost:3000/register')

            # Fill registration form
            await page.fill('[data-testid="email-input"]', 'newuser@example.com')
            await page.fill('[data-testid="password-input"]', 'SecurePass123!')
            await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!')
            await page.fill('[data-testid="name-input"]', 'John Doe')

            # Submit registration
            await page.click('[data-testid="register-button"]')

            # Wait for success message
            await page.wait_for_selector('[data-testid="registration-success"]')

            # Verify email sent
            email_sent = await page.locator('[data-testid="email-verification-sent"]').is_visible()
            assert email_sent

            # Step 2: Simulate email verification
            # In real scenario, this would be done via email link
            verification_token = 'email-verification-token-123'

            await page.goto(f'http://localhost:3000/verify-email?token={verification_token}')

            # Verify account activated
            await page.wait_for_selector('[data-testid="account-activated"]')

            # Step 3: Complete onboarding profile
            await page.click('[data-testid="complete-profile-button"]')

            # Fill profile information
            await page.fill('[data-testid="company-input"]', 'Test Company')
            await page.fill('[data-testid="role-input"]', 'Developer')
            await page.select_option('[data-testid="experience-select"]', '3-5 years')

            # Select interests/features
            await page.check('[data-testid="interest-automation"]')
            await page.check('[data-testid="interest-ai"]')
            await page.check('[data-testid="interest-analytics"]')

            # Complete onboarding
            await page.click('[data-testid="finish-onboarding-button"]')

            # Step 4: Verify dashboard access
            await page.wait_for_url('http://localhost:3000/dashboard')

            # Verify personalized dashboard
            welcome_message = await page.locator('[data-testid="welcome-message"]').text_content()
            assert 'John Doe' in welcome_message

            # Verify recommended features based on interests
            automation_recommended = await page.locator('[data-testid="automation-recommendation"]').is_visible()
            ai_recommended = await page.locator('[data-testid="ai-recommendation"]').is_visible()

            assert automation_recommended
            assert ai_recommended

        finally:
            await page.close()

    @pytest.mark.asyncio
    async def test_user_onboarding_with_social_login(self, browser_context):
        """Test user onboarding with social login"""
        page = await browser_context.new_page()

        try:
            # Navigate to login page
            await page.goto('http://localhost:3000/login')

            # Click Google login
            await page.click('[data-testid="google-login-button"]')

            # Handle OAuth redirect (mocked)
            await page.wait_for_url('**/auth/google/callback*')

            # Complete additional profile setup for social login
            await page.fill('[data-testid="username-input"]', 'johndoe')
            await page.click('[data-testid="complete-social-setup-button"]')

            # Verify successful login and onboarding
            await page.wait_for_url('http://localhost:3000/dashboard')

            # Verify social account linked
            google_linked = await page.locator('[data-testid="google-account-linked"]').is_visible()
            assert google_linked

        finally:
            await page.close()


class TestAgentCreationAndDeploymentWorkflow:
    """Test complete agent creation and deployment workflow"""

    @pytest.mark.asyncio
    async def test_agent_creation_workflow(self, browser_context):
        """Test complete agent creation workflow"""
        page = await browser_context.new_page()

        try:
            # Navigate to agent creation
            await page.goto('http://localhost:3000/agents/create')

            # Step 1: Configure agent basics
            await page.fill('[data-testid="agent-name-input"]', 'Customer Support Bot')
            await page.fill('[data-testid="agent-description-input"]', 'AI-powered customer support automation')
            await page.select_option('[data-testid="agent-type-select"]', 'conversational')

            # Step 2: Configure capabilities
            await page.check('[data-testid="capability-chat"]')
            await page.check('[data-testid="capability-ticket-management"]')
            await page.check('[data-testid="capability-knowledge-base"]')

            # Step 3: Set up training data
            await page.click('[data-testid="upload-training-data-button"]')
            await page.set_input_files('[data-testid="file-upload"]', ['test-data.csv'])

            # Step 4: Configure personality and responses
            await page.fill('[data-testid="system-prompt-input"]', 'You are a helpful customer support assistant...')
            await page.select_option('[data-testid="tone-select"]', 'professional')
            await page.select_option('[data-testid="language-select"]', 'en')

            # Step 5: Set up integrations
            await page.click('[data-testid="add-integration-button"]')
            await page.select_option('[data-testid="integration-type-select"]', 'zendesk')
            await page.fill('[data-testid="api-key-input"]', 'zendesk-api-key')
            await page.click('[data-testid="save-integration-button"]')

            # Step 6: Test agent
            await page.click('[data-testid="test-agent-button"]')
            await page.fill('[data-testid="test-message-input"]', 'How do I reset my password?')
            await page.click('[data-testid="send-test-message-button"]')

            # Wait for response
            await page.wait_for_selector('[data-testid="agent-response"]')
            response_text = await page.locator('[data-testid="agent-response"]').text_content()
            assert len(response_text) > 0

            # Step 7: Deploy agent
            await page.click('[data-testid="deploy-agent-button"]')
            await page.select_option('[data-testid="environment-select"]', 'staging')
            await page.click('[data-testid="confirm-deploy-button"]')

            # Wait for deployment completion
            await page.wait_for_selector('[data-testid="deployment-success"]')

            # Verify agent is live
            agent_status = await page.locator('[data-testid="agent-status"]').text_content()
            assert 'Live' in agent_status

        finally:
            await page.close()

    @pytest.mark.asyncio
    async def test_agent_deployment_and_monitoring(self, browser_context):
        """Test agent deployment and real-time monitoring"""
        page = await browser_context.new_page()

        try:
            # Navigate to deployed agent
            await page.goto('http://localhost:3000/agents/customer-support-bot')

            # Verify agent is running
            status_indicator = await page.locator('[data-testid="agent-status-indicator"]').get_attribute('class')
            assert 'status-live' in status_indicator

            # Check monitoring dashboard
            response_count = await page.locator('[data-testid="total-responses"]').text_content()
            assert int(response_count) >= 0

            # Test real-time metrics
            initial_requests = await page.locator('[data-testid="active-requests"]').text_content()

            # Simulate user interaction (would normally come from external source)
            # In test environment, we mock this
            await page.evaluate("""
                window.mockUserInteraction();
            """)

            # Verify metrics updated
            await page.wait_for_function("""
                () => {
                    const current = parseInt(document.querySelector('[data-testid="active-requests"]').textContent);
                    const initial = parseInt(window.initialRequests);
                    return current !== initial;
                }
            """, arg=initial_requests)

        finally:
            await page.close()


class TestContentCreationAndPublishingWorkflow:
    """Test complete content creation and publishing workflow"""

    @pytest.mark.asyncio
    async def test_social_media_content_workflow(self, browser_context):
        """Test social media content creation and publishing workflow"""
        page = await browser_context.new_page()

        try:
            # Navigate to content creation
            await page.goto('http://localhost:3000/content/create')

            # Step 1: Choose content type
            await page.click('[data-testid="content-type-social"]')

            # Step 2: AI-assisted content generation
            await page.fill('[data-testid="topic-input"]', 'AI automation benefits')
            await page.select_option('[data-testid="platform-select"]', 'linkedin')
            await page.click('[data-testid="generate-content-button"]')

            # Wait for AI generation
            await page.wait_for_selector('[data-testid="generated-content"]')
            generated_text = await page.locator('[data-testid="generated-content"]').text_content()
            assert len(generated_text) > 50

            # Step 3: Edit and customize
            await page.click('[data-testid="edit-content-button"]')
            await page.fill('[data-testid="content-editor"]', generated_text + ' #AI #Automation')
            await page.click('[data-testid="save-edits-button"]')

            # Step 4: Add media
            await page.click('[data-testid="add-media-button"]')
            await page.set_input_files('[data-testid="media-upload"]', ['test-image.jpg'])

            # Step 5: Schedule posting
            await page.click('[data-testid="schedule-post-button"]')
            await page.fill('[data-testid="schedule-date-input"]', '2024-02-01')
            await page.fill('[data-testid="schedule-time-input"]', '10:00')
            await page.click('[data-testid="confirm-schedule-button"]')

            # Step 6: Review and publish
            await page.click('[data-testid="review-post-button"]')

            # Verify preview
            preview_text = await page.locator('[data-testid="post-preview"]').text_content()
            assert 'AI automation benefits' in preview_text
            assert '#AI #Automation' in preview_text

            # Publish immediately for testing
            await page.click('[data-testid="publish-now-button"]')

            # Wait for success confirmation
            await page.wait_for_selector('[data-testid="publish-success"]')

            # Verify post in content library
            await page.goto('http://localhost:3000/content/library')
            published_post = await page.locator('[data-testid="content-item"]').first
            post_status = await published_post.locator('[data-testid="content-status"]').text_content()
            assert 'Published' in post_status

        finally:
            await page.close()

    @pytest.mark.asyncio
    async def test_multi_platform_publishing_workflow(self, browser_context):
        """Test content publishing across multiple platforms"""
        page = await browser_context.new_page()

        try:
            # Create content for multi-platform publishing
            await page.goto('http://localhost:3000/content/create')
            await page.click('[data-testid="content-type-blog"]')
            await page.fill('[data-testid="title-input"]', 'The Future of AI Automation')
            await page.fill('[data-testid="content-editor"]', 'Comprehensive blog post content...')

            # Step 1: Select multiple platforms
            await page.check('[data-testid="platform-twitter"]')
            await page.check('[data-testid="platform-linkedin"]')
            await page.check('[data-testid="platform-medium"]')

            # Step 2: Customize per platform
            # Twitter version
            await page.fill('[data-testid="twitter-content"]', 'Short Twitter version #AI')

            # LinkedIn version
            await page.fill('[data-testid="linkedin-content"]', 'Professional LinkedIn version')

            # Medium version (full content)
            await page.check('[data-testid="medium-full-content"]')

            # Step 3: Schedule different times per platform
            await page.fill('[data-testid="twitter-schedule"]', '2024-02-01T09:00')
            await page.fill('[data-testid="linkedin-schedule"]', '2024-02-01T14:00')
            await page.fill('[data-testid="medium-schedule"]', '2024-02-02T10:00')

            # Step 4: Publish to all platforms
            await page.click('[data-testid="publish-all-button"]')

            # Wait for multi-platform publishing completion
            await page.wait_for_selector('[data-testid="multi-platform-success"]')

            # Verify publishing results
            results = await page.locator('[data-testid="platform-result"]').all()

            assert len(results) == 3

            # Check each platform result
            for result in results:
                status = await result.locator('[data-testid="result-status"]').text_content()
                assert status in ['Scheduled', 'Published']

        finally:
            await page.close()


class TestWorkflowAutomationAndMonitoring:
    """Test workflow automation and monitoring"""

    @pytest.mark.asyncio
    async def test_automated_data_processing_workflow(self, browser_context):
        """Test automated data processing workflow"""
        page = await browser_context.new_page()

        try:
            # Navigate to workflow builder
            await page.goto('http://localhost:3000/workflows/builder')

            # Step 1: Create data processing workflow
            await page.fill('[data-testid="workflow-name-input"]', 'Data Processing Pipeline')
            await page.select_option('[data-testid="workflow-type-select"]', 'data-processing')

            # Step 2: Add workflow steps
            # Data ingestion step
            await page.click('[data-testid="add-step-button"]')
            await page.select_option('[data-testid="step-type-select"]', 'data-ingestion')
            await page.fill('[data-testid="source-url-input"]', 'https://api.example.com/data')
            await page.click('[data-testid="save-step-button"]')

            # Data transformation step
            await page.click('[data-testid="add-step-button"]')
            await page.select_option('[data-testid="step-type-select"]', 'data-transformation')
            await page.select_option('[data-testid="transform-type-select"]', 'filter-and-clean')
            await page.click('[data-testid="save-step-button"]')

            # Data storage step
            await page.click('[data-testid="add-step-button"]')
            await page.select_option('[data-testid="step-type-select"]', 'data-storage')
            await page.select_option('[data-testid="storage-type-select"]', 'database')
            await page.fill('[data-testid="table-name-input"]', 'processed_data')
            await page.click('[data-testid="save-step-button"]')

            # Step 3: Configure triggers
            await page.click('[data-testid="add-trigger-button"]')
            await page.select_option('[data-testid="trigger-type-select"]', 'schedule')
            await page.fill('[data-testid="schedule-input"]', '0 */6 * * *')  # Every 6 hours
            await page.click('[data-testid="save-trigger-button"]')

            # Step 4: Set up monitoring
            await page.click('[data-testid="configure-monitoring-button"]')
            await page.check('[data-testid="monitor-performance"]')
            await page.check('[data-testid="monitor-errors"]')
            await page.fill('[data-testid="alert-email-input"]', 'admin@example.com')
            await page.click('[data-testid="save-monitoring-button"]')

            # Step 5: Activate workflow
            await page.click('[data-testid="activate-workflow-button"]')
            await page.click('[data-testid="confirm-activate-button"]')

            # Wait for activation
            await page.wait_for_selector('[data-testid="workflow-active"]')

            # Step 6: Monitor workflow execution
            await page.click('[data-testid="view-monitoring-button"]')

            # Wait for first execution (mocked)
            await page.wait_for_selector('[data-testid="execution-complete"]')

            # Verify execution results
            execution_status = await page.locator('[data-testid="execution-status"]').text_content()
            assert execution_status == 'Success'

            processed_records = await page.locator('[data-testid="processed-records"]').text_content()
            assert int(processed_records) > 0

        finally:
            await page.close()

    @pytest.mark.asyncio
    async def test_workflow_error_handling_and_recovery(self, browser_context):
        """Test workflow error handling and recovery"""
        page = await browser_context.new_page()

        try:
            # Navigate to active workflow
            await page.goto('http://localhost:3000/workflows/data-processing-pipeline')

            # Simulate workflow error (through test controls)
            await page.click('[data-testid="simulate-error-button"]')
            await page.select_option('[data-testid="error-type-select"]', 'connection-failure')
            await page.click('[data-testid="trigger-error-button"]')

            # Wait for error detection
            await page.wait_for_selector('[data-testid="workflow-error"]')

            # Verify error details
            error_message = await page.locator('[data-testid="error-message"]').text_content()
            assert 'connection-failure' in error_message

            # Test automatic recovery
            await page.click('[data-testid="enable-auto-recovery-button"]')

            # Wait for recovery attempt
            await page.wait_for_selector('[data-testid="recovery-attempted"]')

            # Verify recovery result
            recovery_status = await page.locator('[data-testid="recovery-status"]').text_content()
            assert recovery_status in ['Recovered', 'Failed - Manual Intervention Required']

            # Test manual intervention if needed
            if recovery_status == 'Failed - Manual Intervention Required':
                await page.click('[data-testid="manual-recovery-button"]')
                await page.fill('[data-testid="manual-fix-input"]', 'Fixed connection string')
                await page.click('[data-testid="apply-manual-fix-button"]')

                # Wait for manual recovery
                await page.wait_for_selector('[data-testid="manual-recovery-success"]')

        finally:
            await page.close()


class TestCollaborativeWorkflow:
    """Test collaborative multi-user workflows"""

    @pytest.mark.asyncio
    async def test_team_collaboration_workflow(self, browser_context):
        """Test team collaboration on shared workflows"""
        # Create multiple browser contexts for different users
        playwright = await browser_context._browser._playwright
        browser = await playwright.chromium.launch()

        admin_context = await browser.new_context()
        user1_context = await browser.new_context()
        user2_context = await browser.new_context()

        try:
            admin_page = await admin_context.new_page()
            user1_page = await user1_context.new_page()
            user2_page = await user2_context.new_page()

            # Step 1: Admin creates team project
            await admin_page.goto('http://localhost:3000/projects/create')
            await admin_page.fill('[data-testid="project-name-input"]', 'AI Marketing Campaign')
            await admin_page.fill('[data-testid="project-description-input"]', 'Collaborative AI marketing project')
            await admin_page.click('[data-testid="create-project-button"]')

            # Step 2: Admin invites team members
            await admin_page.click('[data-testid="invite-members-button"]')
            await admin_page.fill('[data-testid="invite-email-input"]', 'user1@example.com')
            await admin_page.select_option('[data-testid="invite-role-select"]', 'editor')
            await admin_page.click('[data-testid="send-invite-button"]')

            await admin_page.fill('[data-testid="invite-email-input"]', 'user2@example.com')
            await admin_page.select_option('[data-testid="invite-role-select"]', 'viewer')
            await admin_page.click('[data-testid="send-invite-button"]')

            # Step 3: Team members accept invitations (simulated)
            await user1_page.goto('http://localhost:3000/invitations')
            await user1_page.click('[data-testid="accept-invite-button"]')

            await user2_page.goto('http://localhost:3000/invitations')
            await user2_page.click('[data-testid="accept-invite-button"]')

            # Step 4: Collaborative content creation
            # User 1 creates content
            await user1_page.goto('http://localhost:3000/projects/ai-marketing-campaign')
            await user1_page.click('[data-testid="create-content-button"]')
            await user1_page.fill('[data-testid="content-title-input"]', 'AI Marketing Strategy')
            await user1_page.fill('[data-testid="content-body-input"]', 'Initial draft...')
            await user1_page.click('[data-testid="save-content-button"]')

            # User 2 views and comments
            await user2_page.goto('http://localhost:3000/projects/ai-marketing-campaign')
            await user2_page.click('[data-testid="content-item"]:first-child')
            await user2_page.fill('[data-testid="comment-input"]', 'Great start! Consider adding metrics.')
            await user2_page.click('[data-testid="post-comment-button"]')

            # User 1 sees comment and updates content
            await user1_page.reload()
            comment_text = await user1_page.locator('[data-testid="comment-text"]').text_content()
            assert 'metrics' in comment_text

            await user1_page.click('[data-testid="edit-content-button"]')
            await user1_page.fill('[data-testid="content-body-input"]', 'Updated draft with metrics...')
            await user1_page.click('[data-testid="save-content-button"]')

            # Step 5: Admin reviews and approves
            await admin_page.goto('http://localhost:3000/projects/ai-marketing-campaign')
            await admin_page.click('[data-testid="review-changes-button"]')
            await admin_page.click('[data-testid="approve-changes-button"]')

            # Verify collaboration success
            approval_status = await admin_page.locator('[data-testid="approval-status"]').text_content()
            assert 'Approved' in approval_status

        finally:
            await admin_page.close()
            await user1_page.close()
            await user2_page.close()
            await admin_context.close()
            await user1_context.close()
            await user2_context.close()
            await browser.close()


class TestSystemIntegrationWorkflow:
    """Test system-wide integration workflows"""

    @pytest.mark.asyncio
    async def test_cross_service_data_flow(self):
        """Test data flow across multiple services"""
        # Test complete data journey through the system

        # Step 1: Data ingestion service
        ingestion_response = await self.ingest_test_data({
            'source': 'external-api',
            'data_type': 'user-behavior',
            'records': 1000
        })
        assert ingestion_response['status'] == 'ingested'
        batch_id = ingestion_response['batch_id']

        # Step 2: Data processing service
        processing_response = await self.process_data_batch(batch_id, {
            'transformations': ['clean', 'normalize', 'aggregate'],
            'output_format': 'analytics-ready'
        })
        assert processing_response['status'] == 'processed'
        processed_batch_id = processing_response['processed_batch_id']

        # Step 3: Analytics service
        analytics_response = await self.run_analytics(processed_batch_id, {
            'metrics': ['conversion_rate', 'engagement_score', 'retention_rate'],
            'time_range': 'last_30_days'
        })
        assert analytics_response['status'] == 'completed'
        assert len(analytics_response['insights']) > 0

        # Step 4: Reporting service
        report_response = await self.generate_report({
            'analytics_data': analytics_response['insights'],
            'format': 'dashboard',
            'recipients': ['admin@example.com']
        })
        assert report_response['status'] == 'delivered'

        # Step 5: Alert service (if thresholds breached)
        alerts_triggered = await self.check_alerts(analytics_response['insights'])
        if alerts_triggered:
            alert_response = await self.process_alerts(alerts_triggered)
            assert alert_response['notifications_sent'] > 0

    async def ingest_test_data(self, config):
        """Mock data ingestion"""
        return {
            'status': 'ingested',
            'batch_id': 'batch-123',
            'records_processed': config['records']
        }

    async def process_data_batch(self, batch_id, config):
        """Mock data processing"""
        return {
            'status': 'processed',
            'processed_batch_id': f'processed-{batch_id}',
            'transformations_applied': config['transformations']
        }

    async def run_analytics(self, batch_id, config):
        """Mock analytics processing"""
        return {
            'status': 'completed',
            'insights': [
                {'metric': 'conversion_rate', 'value': 0.15, 'change': 0.02},
                {'metric': 'engagement_score', 'value': 8.5, 'change': 0.3},
                {'metric': 'retention_rate', 'value': 0.85, 'change': -0.01}
            ]
        }

    async def generate_report(self, config):
        """Mock report generation"""
        return {
            'status': 'delivered',
            'report_id': 'report-456',
            'recipients_notified': len(config['recipients'])
        }

    async def check_alerts(self, insights):
        """Mock alert checking"""
        return [
            {'type': 'threshold_breach', 'metric': 'engagement_score', 'severity': 'high'}
        ]

    async def process_alerts(self, alerts):
        """Mock alert processing"""
        return {
            'notifications_sent': len(alerts),
            'escalation_required': any(a['severity'] == 'high' for a in alerts)
        }


class TestErrorRecoveryAndResilience:
    """Test error recovery and system resilience"""

    @pytest.mark.asyncio
    async def test_service_failure_recovery_workflow(self, browser_context):
        """Test workflow when services fail and recover"""
        page = await browser_context.new_page()

        try:
            # Start a complex workflow
            await page.goto('http://localhost:3000/workflows/complex-automation')

            # Step 1: Workflow starts successfully
            await page.click('[data-testid="start-workflow-button"]')
            await page.wait_for_selector('[data-testid="workflow-running"]')

            # Step 2: Simulate service failure
            # In test environment, trigger service failure
            await page.evaluate("""
                window.simulateServiceFailure('data-processor');
            """)

            # Wait for error detection
            await page.wait_for_selector('[data-testid="workflow-error"]')

            # Verify error handling UI
            error_details = await page.locator('[data-testid="error-details"]').text_content()
            assert 'data-processor' in error_details

            # Step 3: System attempts automatic recovery
            await page.wait_for_selector('[data-testid="recovery-attempt"]')

            recovery_status = await page.locator('[data-testid="recovery-status"]').text_content()

            if recovery_status == 'Recovery Successful':
                # Verify workflow continues
                await page.wait_for_selector('[data-testid="workflow-running"]')
                final_status = await page.locator('[data-testid="workflow-status"]').text_content()
                assert 'Completed' in final_status
            else:
                # Manual intervention required
                await page.click('[data-testid="manual-recovery-button"]')

                # Apply manual fix
                await page.select_option('[data-testid="recovery-action-select"]', 'restart-service')
                await page.click('[data-testid="apply-recovery-button"]')

                # Wait for manual recovery
                await page.wait_for_selector('[data-testid="manual-recovery-success"]')

                # Verify workflow completion
                final_status = await page.locator('[data-testid="workflow-status"]').text_content()
                assert 'Completed' in final_status

        finally:
            await page.close()

    @pytest.mark.asyncio
    async def test_load_balancing_under_high_load(self, browser_context):
        """Test system behavior under high load with load balancing"""
        page = await browser_context.new_page()

        try:
            # Navigate to load testing interface
            await page.goto('http://localhost:3000/testing/load-test')

            # Configure high load test
            await page.fill('[data-testid="concurrent-users-input"]', '1000')
            await page.fill('[data-testid="test-duration-input"]', '300')  # 5 minutes
            await page.select_option('[data-testid="test-type-select"]', 'realistic-workflow')

            # Start load test
            await page.click('[data-testid="start-load-test-button"]')

            # Monitor during test
            for i in range(30):  # Monitor for 30 seconds
                await asyncio.sleep(1)

                # Check system metrics
                active_users = await page.locator('[data-testid="active-users"]').text_content()
                response_time = await page.locator('[data-testid="avg-response-time"]').text_content()
                error_rate = await page.locator('[data-testid="error-rate"]').text_content()

                # Verify system remains stable
                assert int(active_users) > 0
                assert float(response_time) < 5000  # Under 5 seconds
                assert float(error_rate) < 0.05  # Under 5% error rate

                # Check load balancer distribution
                server_loads = await page.locator('[data-testid="server-load"]').all()
                for server_load in server_loads:
                    load_percentage = await server_load.text_content()
                    assert float(load_percentage.strip('%')) < 90  # No server over 90% load

            # Wait for test completion
            await page.wait_for_selector('[data-testid="load-test-complete"]')

            # Verify test results
            final_report = await page.locator('[data-testid="load-test-report"]').text_content()
            assert 'PASSED' in final_report

        finally:
            await page.close()