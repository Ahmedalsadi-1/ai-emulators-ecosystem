"""
Comprehensive Authentication Flow Tests

Tests complete authentication workflows across different services and scenarios,
including JWT handling, OAuth flows, role-based access control, and security validations.
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional

# Import shared testing utilities
from testing_utils import (
    mock_auth_service,
    generate_test_user,
    create_mock_request,
    create_mock_response,
    create_auth_token,
    mock_auth_middleware,
    wait_for,
)


class TestAuthenticationFlows:
    """Comprehensive authentication flow test suite"""

    @pytest.fixture
    def auth_service(self):
        """Mock authentication service"""
        return mock_auth_service()

    @pytest.fixture
    def test_users(self):
        """Test user fixtures"""
        return {
            "admin": generate_test_user(
                id="admin-123", role="admin", permissions=["read", "write", "delete"]
            ),
            "user": generate_test_user(
                id="user-123", role="user", permissions=["read"]
            ),
            "guest": generate_test_user(id="guest-123", role="guest", permissions=[]),
        }

    @pytest.fixture
    def jwt_tokens(self, test_users):
        """JWT tokens for different user types"""
        return {
            "admin": create_auth_token(test_users["admin"]["id"], "admin"),
            "user": create_auth_token(test_users["user"]["id"], "user"),
            "guest": create_auth_token(test_users["guest"]["id"], "guest"),
            "expired": "expired.jwt.token",
            "malformed": "malformed.jwt",
        }

    @pytest.mark.asyncio
    async def test_jwt_authentication_flow(self, auth_service, test_users, jwt_tokens):
        """Test complete JWT authentication flow"""
        # Test successful authentication
        admin_user = test_users["admin"]
        admin_token = jwt_tokens["admin"]

        auth_result = await auth_service.authenticate_token(admin_token, "jwt")

        assert auth_result["success"] is True
        assert auth_result["user"]["id"] == admin_user["id"]
        assert auth_result["user"]["role"] == admin_user["role"]
        assert set(auth_result["user"]["permissions"]) == set(admin_user["permissions"])

        # Verify token structure
        assert "token" in auth_result
        assert auth_result["token"]["type"] == "jwt"
        assert auth_result["token"]["expires_at"] > datetime.now(timezone.utc)

    @pytest.mark.asyncio
    async def test_role_based_access_control(
        self, auth_service, test_users, jwt_tokens
    ):
        """Test role-based access control scenarios"""

        # Test admin permissions
        admin_result = await auth_service.authenticate_token(jwt_tokens["admin"], "jwt")
        assert admin_result["success"] is True
        assert "delete" in admin_result["user"]["permissions"]

        # Test user permissions
        user_result = await auth_service.authenticate_token(jwt_tokens["user"], "jwt")
        assert user_result["success"] is True
        assert "read" in user_result["user"]["permissions"]
        assert "delete" not in user_result["user"]["permissions"]

        # Test guest permissions
        guest_result = await auth_service.authenticate_token(jwt_tokens["guest"], "jwt")
        assert guest_result["success"] is True
        assert len(guest_result["user"]["permissions"]) == 0

    @pytest.mark.asyncio
    async def test_token_expiration_handling(self, auth_service):
        """Test JWT token expiration scenarios"""
        # Mock expired token
        auth_service.validate_token = AsyncMock(side_effect=Exception("Token expired"))

        expired_token = "expired.jwt.token"
        result = await auth_service.authenticate_token(expired_token, "jwt")

        assert result["success"] is False
        assert result["error"] == "Token validation failed"
        assert result["code"] == "TOKEN_EXPIRED"

    @pytest.mark.asyncio
    async def test_api_key_authentication_flow(self, auth_service, test_users):
        """Test API key authentication flow"""
        # Test valid API key
        api_key = "valid-api-key-123"
        auth_result = await auth_service.authenticate_token(
            f"Bearer {api_key}", "api_key"
        )

        assert auth_result["success"] is True
        assert auth_result["user"]["authentication_type"] == "api_key"

        # Test invalid API key
        invalid_key = "invalid-api-key"
        invalid_result = await auth_service.authenticate_token(
            f"Bearer {invalid_key}", "api_key"
        )

        assert invalid_result["success"] is False
        assert invalid_result["code"] == "API_KEY_INVALID"

    @pytest.mark.asyncio
    async def test_oauth_flow_simulation(self, auth_service):
        """Test OAuth authentication flow simulation"""
        # Mock OAuth provider response
        oauth_code = "oauth-authorization-code"
        oauth_result = {
            "access_token": "oauth-access-token",
            "refresh_token": "oauth-refresh-token",
            "expires_in": 3600,
            "user_info": {
                "id": "oauth-user-123",
                "email": "oauth@example.com",
                "name": "OAuth User",
            },
        }

        # Mock OAuth token exchange
        auth_service.exchange_oauth_code = AsyncMock(return_value=oauth_result)

        result = await auth_service.authenticate_oauth(oauth_code, "google")

        assert result["success"] is True
        assert result["user"]["id"] == oauth_result["user_info"]["id"]
        assert result["tokens"]["access_token"] == oauth_result["access_token"]
        assert result["tokens"]["refresh_token"] == oauth_result["refresh_token"]

    @pytest.mark.asyncio
    async def test_multi_factor_authentication(self, auth_service, test_users):
        """Test multi-factor authentication flow"""
        user = test_users["admin"]

        # First factor: password
        password_result = await auth_service.authenticate_password(
            user["email"], "correct-password"
        )
        assert password_result["success"] is True
        assert password_result["requires_mfa"] is True

        # Second factor: TOTP
        mfa_code = "123456"  # Valid TOTP code
        mfa_result = await auth_service.authenticate_mfa(
            password_result["session_id"], mfa_code
        )

        assert mfa_result["success"] is True
        assert mfa_result["user"]["id"] == user["id"]
        assert mfa_result["mfa_verified"] is True

        # Invalid MFA code
        invalid_mfa_result = await auth_service.authenticate_mfa(
            password_result["session_id"], "000000"
        )
        assert invalid_mfa_result["success"] is False
        assert invalid_mfa_result["code"] == "MFA_INVALID"

    @pytest.mark.asyncio
    async def test_session_management(self, auth_service, test_users):
        """Test user session management"""
        user = test_users["admin"]

        # Create session
        session_result = await auth_service.create_session(user["id"])
        assert session_result["success"] is True
        assert "session_id" in session_result

        session_id = session_result["session_id"]

        # Validate session
        validation_result = await auth_service.validate_session(session_id)
        assert validation_result["valid"] is True
        assert validation_result["user"]["id"] == user["id"]

        # Extend session
        extend_result = await auth_service.extend_session(session_id)
        assert extend_result["success"] is True

        # Destroy session
        destroy_result = await auth_service.destroy_session(session_id)
        assert destroy_result["success"] is True

        # Verify session is destroyed
        post_destroy_validation = await auth_service.validate_session(session_id)
        assert post_destroy_validation["valid"] is False

    @pytest.mark.asyncio
    async def test_password_reset_flow(self, auth_service, test_users):
        """Test password reset flow"""
        user = test_users["user"]
        user_email = user["email"]

        # Request password reset
        reset_request = await auth_service.request_password_reset(user_email)
        assert reset_request["success"] is True
        assert "reset_token" in reset_request

        reset_token = reset_request["reset_token"]

        # Reset password with valid token
        new_password = "new-secure-password"
        reset_result = await auth_service.reset_password(reset_token, new_password)

        assert reset_result["success"] is True
        assert reset_result["message"] == "Password reset successfully"

        # Try to use reset token again (should fail)
        reuse_result = await auth_service.reset_password(
            reset_token, "another-password"
        )
        assert reuse_result["success"] is False
        assert reuse_result["code"] == "RESET_TOKEN_USED"

    @pytest.mark.asyncio
    async def test_rate_limiting_protection(self, auth_service):
        """Test rate limiting on authentication attempts"""
        # Simulate multiple failed login attempts
        for i in range(10):
            result = await auth_service.authenticate_password(
                "user@example.com", f"wrong-password-{i}"
            )
            if i < 5:  # First 5 attempts should fail normally
                assert result["success"] is False
                assert result["code"] == "INVALID_CREDENTIALS"
            else:  # Subsequent attempts should be rate limited
                assert result["success"] is False
                assert result["code"] == "RATE_LIMITED"

        # Wait for rate limit to reset (simulate time passing)
        await auth_service.reset_rate_limits()

        # Should work again after reset
        result = await auth_service.authenticate_password(
            "user@example.com", "correct-password"
        )
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_cross_service_authentication(self, auth_service, test_users):
        """Test authentication across multiple services"""
        user = test_users["admin"]

        # Authenticate with service A
        service_a_token = await auth_service.generate_service_token(
            user["id"], "service-a"
        )
        assert service_a_token["success"] is True

        # Use token with service B (cross-service authentication)
        cross_service_result = await auth_service.validate_cross_service_token(
            service_a_token["token"], "service-b"
        )

        assert cross_service_result["valid"] is True
        assert cross_service_result["user"]["id"] == user["id"]
        assert cross_service_result["allowed_services"] == ["service-a", "service-b"]

    @pytest.mark.asyncio
    async def test_security_headers_validation(self, auth_service):
        """Test security headers in authentication responses"""
        user = test_users["user"]

        auth_result = await auth_service.authenticate_user(user["email"], "password")

        # Check security headers in response
        response_headers = auth_result.get("security_headers", {})
        required_headers = [
            "x-content-type-options",
            "x-frame-options",
            "x-xss-protection",
            "strict-transport-security",
        ]

        for header in required_headers:
            assert header in response_headers, f"Missing security header: {header}"

    @pytest.mark.asyncio
    async def test_audit_logging(self, auth_service, test_users):
        """Test authentication audit logging"""
        user = test_users["user"]

        # Clear previous audit logs
        auth_service.clear_audit_logs()

        # Perform various authentication actions
        await auth_service.authenticate_user(user["email"], "password")
        await auth_service.validate_session("session-123")
        await auth_service.generate_token(user["id"])

        # Check audit logs
        audit_logs = auth_service.get_audit_logs()

        expected_events = [
            "user_authentication",
            "session_validation",
            "token_generation",
        ]
        logged_events = [log["event"] for log in audit_logs]

        for event in expected_events:
            assert event in logged_events, f"Missing audit event: {event}"

        # Verify log details
        for log in audit_logs:
            assert "timestamp" in log
            assert "user_id" in log
            assert "ip_address" in log
            assert "user_agent" in log

    @pytest.mark.asyncio
    async def test_concurrent_authentication_load(self, auth_service, test_users):
        """Test authentication under concurrent load"""
        users = list(test_users.values())
        num_requests = 50

        # Create concurrent authentication requests
        auth_tasks = []
        for i in range(num_requests):
            user = users[i % len(users)]
            task = auth_service.authenticate_user(user["email"], f"password-{i}")
            auth_tasks.append(task)

        # Execute all requests concurrently
        results = await asyncio.gather(*auth_tasks, return_exceptions=True)

        # Verify results
        successful_auths = 0
        for result in results:
            if isinstance(result, Exception):
                pytest.fail(f"Authentication failed with exception: {result}")
            elif result["success"]:
                successful_auths += 1

        # Should handle all concurrent requests
        assert successful_auths == num_requests

        # Verify no race conditions in session/token management
        all_sessions = auth_service.get_all_active_sessions()
        assert len(all_sessions) <= num_requests

    @pytest.mark.asyncio
    async def test_authentication_error_handling(self, auth_service):
        """Test comprehensive error handling in authentication"""
        error_scenarios = [
            ("empty_token", "", "jwt", "NO_TOKEN"),
            ("null_token", None, "jwt", "INVALID_TOKEN"),
            ("malformed_token", "not.a.jwt", "jwt", "TOKEN_MALFORMED"),
            ("empty_password", "user@example.com", "", "EMPTY_PASSWORD"),
            ("sql_injection_attempt", "admin'--", "password", "INVALID_CREDENTIALS"),
            ("xss_attempt", "<script>alert(1)</script>", "password", "INVALID_INPUT"),
        ]

        for scenario_name, *args in error_scenarios:
            if len(args) == 3:
                identifier, secret, auth_type = args
                result = await auth_service.authenticate_credentials(
                    identifier, secret, auth_type
                )
            else:
                token, auth_type, expected_code = args
                result = await auth_service.authenticate_token(token, auth_type)

            assert result["success"] is False, f"Scenario {scenario_name} should fail"
            assert result["code"] == expected_code, (
                f"Scenario {scenario_name} wrong error code"
            )

    @pytest.mark.parametrize(
        "user_role,resource,action,expected_result",
        [
            ("admin", "users", "delete", True),
            ("admin", "system", "configure", True),
            ("user", "users", "read", True),
            ("user", "users", "delete", False),
            ("user", "system", "configure", False),
            ("guest", "users", "read", False),
            ("guest", "public", "read", True),
        ],
    )
    @pytest.mark.asyncio
    async def test_authorization_matrix(
        self, auth_service, test_users, user_role, resource, action, expected_result
    ):
        """Test authorization matrix for different user roles and permissions"""
        user = test_users[user_role]

        # Authenticate user
        auth_result = await auth_service.authenticate_user(user["email"], "password")
        assert auth_result["success"] is True

        user_token = auth_result["token"]

        # Test authorization
        authz_result = await auth_service.authorize_action(user_token, resource, action)

        assert authz_result["allowed"] == expected_result

        if not expected_result:
            assert authz_result["reason"] is not None
            assert (
                "permission" in authz_result["reason"].lower()
                or "role" in authz_result["reason"].lower()
            )


class TestAuthenticationMiddleware:
    """Test authentication middleware components"""

    @pytest.fixture
    def mock_request(self):
        return create_mock_request()

    @pytest.fixture
    def mock_response(self):
        return create_mock_response()

    def test_jwt_middleware_success(self, mock_request, mock_response):
        """Test JWT authentication middleware success"""
        user = generate_test_user()
        middleware = mock_auth_middleware(user)

        next_called = False

        def mock_next():
            nonlocal next_called
            next_called = True

        middleware(mock_request, mock_response, mock_next)

        assert next_called is True
        assert mock_request.user == user

    def test_jwt_middleware_failure(self, mock_request, mock_response):
        """Test JWT authentication middleware failure"""
        middleware = mock_auth_middleware()

        # Mock authentication failure
        middleware.authenticate = Mock(
            return_value={"success": False, "error": "Invalid token"}
        )

        next_called = False

        def mock_next():
            nonlocal next_called
            next_called = True

        middleware(mock_request, mock_response, mock_next)

        assert next_called is False
        assert mock_response.status_code == 401

    def test_role_based_middleware(self, mock_request, mock_response):
        """Test role-based access control middleware"""
        user = generate_test_user(role="admin")
        middleware = mock_auth_middleware(user)

        # Require admin role
        role_middleware = middleware.require_role("admin")

        next_called = False

        def mock_next():
            nonlocal next_called
            next_called = True

        role_middleware(mock_request, mock_response, mock_next)

        assert next_called is True

        # Test insufficient role
        user_low = generate_test_user(role="user")
        middleware_low = mock_auth_middleware(user_low)
        role_middleware_admin = middleware_low.require_role("admin")

        next_called = False
        role_middleware_admin(mock_request, mock_response, mock_next)

        assert next_called is False
        assert mock_response.status_code == 403


class TestAuthenticationIntegration:
    """Integration tests for authentication across services"""

    @pytest.mark.asyncio
    async def test_cross_service_token_exchange(self):
        """Test token exchange between different services"""
        # This would test actual service-to-service authentication
        # For now, we'll mock the integration

        service_a_auth = mock_auth_service()
        service_b_auth = mock_auth_service()

        # Service A authenticates user and generates cross-service token
        user = generate_test_user()
        cross_service_token = await service_a_auth.generate_cross_service_token(
            user["id"], ["service-b"]
        )

        # Service B validates the cross-service token
        validation_result = await service_b_auth.validate_cross_service_token(
            cross_service_token["token"]
        )

        assert validation_result["valid"] is True
        assert validation_result["user"]["id"] == user["id"]
        assert "service-b" in validation_result["allowed_services"]

    @pytest.mark.asyncio
    async def test_federated_authentication(self):
        """Test federated authentication across multiple identity providers"""
        auth_service = mock_auth_service()

        # Mock multiple identity providers
        providers = ["google", "github", "microsoft"]

        for provider in providers:
            # Simulate OAuth flow for each provider
            oauth_result = await auth_service.authenticate_oauth(
                f"code-{provider}", provider
            )

            assert oauth_result["success"] is True
            assert oauth_result["provider"] == provider
            assert "user" in oauth_result
            assert "tokens" in oauth_result

    @pytest.mark.asyncio
    async def test_token_refresh_flow(self):
        """Test JWT token refresh flow"""
        auth_service = mock_auth_service()
        user = generate_test_user()

        # Initial token generation
        initial_result = await auth_service.generate_token(user["id"])
        assert initial_result["success"] is True

        initial_token = initial_result["token"]

        # Refresh token
        refresh_result = await auth_service.refresh_token(
            initial_result["refresh_token"]
        )
        assert refresh_result["success"] is True

        new_token = refresh_result["token"]

        # Verify old token is invalidated
        old_token_valid = await auth_service.validate_token(initial_token)
        assert old_token_valid["valid"] is False

        # Verify new token is valid
        new_token_valid = await auth_service.validate_token(new_token)
        assert new_token_valid["valid"] is True
        assert new_token_valid["user"]["id"] == user["id"]
