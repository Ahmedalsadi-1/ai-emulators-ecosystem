"""
Shared testing utilities for Python projects in the unified ecosystem
"""

import asyncio
import json
import os
import tempfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable, AsyncGenerator
from unittest.mock import Mock, MagicMock, AsyncMock, patch
import pytest


# Mock implementations
def mock_auth_service():
    """Mock authentication service"""
    service = Mock()
    service.validate_token = Mock(return_value=True)
    service.generate_token = Mock(return_value="mock-jwt-token")
    service.refresh_token = Mock(return_value="refreshed-token")
    service.verify_permissions = Mock(return_value=True)
    return service


def mock_database_service():
    """Mock database service"""
    service = Mock()
    service.connect = AsyncMock(return_value=True)
    service.disconnect = AsyncMock(return_value=True)
    service.query = AsyncMock(return_value=[])
    service.transaction = AsyncMock()
    return service


def mock_websocket_service():
    """Mock WebSocket service"""
    service = Mock()
    service.connect = AsyncMock(return_value=True)
    service.disconnect = AsyncMock(return_value=True)
    service.send = AsyncMock(return_value=True)
    service.on = Mock()
    service.emit = AsyncMock()
    return service


def mock_external_api_service():
    """Mock external API service"""
    service = Mock()
    service.get = AsyncMock(return_value={"status": "success"})
    service.post = AsyncMock(return_value={"id": "created-id"})
    service.put = AsyncMock(return_value={"updated": True})
    service.delete = AsyncMock(return_value={"deleted": True})
    return service


# Test data generators
def generate_test_user(**overrides) -> Dict[str, Any]:
    """Generate test user data"""
    user = {
        "id": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    user.update(overrides)
    return user


def generate_test_agent(**overrides) -> Dict[str, Any]:
    """Generate test agent data"""
    agent = {
        "id": "test-agent-id",
        "name": "Test Agent",
        "type": "automation",
        "status": "active",
        "capabilities": ["web-navigation", "data-extraction"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    agent.update(overrides)
    return agent


def generate_test_workflow(**overrides) -> Dict[str, Any]:
    """Generate test workflow data"""
    workflow = {
        "id": "test-workflow-id",
        "name": "Test Workflow",
        "description": "A test workflow",
        "steps": [],
        "status": "draft",
        "created_by": "test-user-id",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    workflow.update(overrides)
    return workflow


# Test helpers
async def wait_for(ms: int) -> None:
    """Async wait helper"""
    await asyncio.sleep(ms / 1000)


def create_mock_request(user=None, **overrides):
    """Create mock request object"""
    if user is None:
        user = generate_test_user()

    request = Mock()
    request.user = user
    request.headers = {}
    request.body = {}
    request.query = {}
    request.params = {}
    request.method = "GET"
    request.url = "/test"

    for key, value in overrides.items():
        setattr(request, key, value)

    return request


def create_mock_response():
    """Create mock response object"""
    response = Mock()
    response.status_code = 200
    response.json = Mock(return_value=response)
    response.text = Mock(return_value="")
    response.headers = {}
    return response


# Authentication helpers
def create_auth_token(user_id="test-user-id", role="user") -> str:
    """Create mock authentication token"""
    return f"mock-jwt-token-{user_id}-{role}"


def mock_auth_middleware(user=None):
    """Mock authentication middleware"""
    if user is None:
        user = generate_test_user()

    async def middleware(request, call_next):
        request.user = user
        return await call_next(request)

    return middleware


# Database helpers
async def setup_test_database():
    """Setup test database"""
    db = mock_database_service()
    await db.connect()
    return db


async def teardown_test_database(db):
    """Teardown test database"""
    await db.disconnect()


# WebSocket helpers
def create_mock_websocket_server():
    """Create mock WebSocket server"""
    server = Mock()
    server.clients = set()
    server.on = Mock()
    server.emit = AsyncMock()
    server.close = AsyncMock()
    return server


def create_mock_websocket_client():
    """Create mock WebSocket client"""
    client = Mock()
    client.send = AsyncMock()
    client.close = AsyncMock()
    client.on = Mock()
    client.once = Mock()
    client.readyState = 1  # OPEN
    return client


# API testing helpers
def create_api_test_context():
    """Create API test context"""
    request = create_mock_request()
    response = create_mock_response()
    return {"request": request, "response": response}


# Cross-service communication helpers
def mock_service_communication():
    """Mock service communication"""
    comm = Mock()
    comm.publish = AsyncMock()
    comm.subscribe = AsyncMock()
    comm.request = AsyncMock()
    comm.respond = AsyncMock()
    return comm


# Performance testing helpers
async def measure_execution_time(func: Callable) -> Dict[str, Any]:
    """Measure execution time of async function"""
    start = datetime.now(timezone.utc)
    result = await func()
    end = datetime.now(timezone.utc)
    execution_time = (end - start).total_seconds() * 1000  # ms
    return {"result": result, "execution_time": execution_time}


def create_performance_test_suite(test_name: str, iterations: int = 100):
    """Create performance test suite"""

    class PerformanceTestSuite:
        def __init__(self, name: str, iters: int):
            self.name = name
            self.iterations = iters

        async def run(self, func: Callable) -> Dict[str, Any]:
            times = []

            for i in range(self.iterations):
                result = await measure_execution_time(func)
                times.append(result["execution_time"])

            avg = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)

            print(f"{self.name} Performance Results:")
            print(f"  Average: {avg:.2f}ms")
            print(f"  Min: {min_time:.2f}ms")
            print(f"  Max: {max_time:.2f}ms")
            print(f"  Iterations: {self.iterations}")

            return {"avg": avg, "min": min_time, "max": max_time, "times": times}

    return PerformanceTestSuite(test_name, iterations)


# Security testing helpers
def create_security_test_payloads():
    """Create security test payloads"""
    return {
        "sql_injection": [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
        ],
        "xss": [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("xss")',
        ],
        "path_traversal": [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "/etc/shadow",
        ],
        "command_injection": [
            "; rm -rf /",
            "| cat /etc/passwd",
            "`whoami`",
        ],
    }


# Async test utilities
class AsyncTestCase:
    """Base class for async tests"""

    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    def tearDown(self):
        self.loop.close()

    def async_test(self, coro):
        """Run async test"""
        return self.loop.run_until_complete(coro)


# Pytest fixtures
@pytest.fixture
def auth_service():
    """Pytest fixture for auth service"""
    return mock_auth_service()


@pytest.fixture
def database_service():
    """Pytest fixture for database service"""
    return mock_database_service()


@pytest.fixture
def websocket_service():
    """Pytest fixture for websocket service"""
    return mock_websocket_service()


@pytest.fixture
def test_user():
    """Pytest fixture for test user"""
    return generate_test_user()


@pytest.fixture
def test_agent():
    """Pytest fixture for test agent"""
    return generate_test_agent()


@pytest.fixture
def test_workflow():
    """Pytest fixture for test workflow"""
    return generate_test_workflow()


@pytest.fixture
def mock_request():
    """Pytest fixture for mock request"""
    return create_mock_request()


@pytest.fixture
def mock_response():
    """Pytest fixture for mock response"""
    return create_mock_response()


# Test database setup
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def temp_db():
    """Temporary database for testing"""
    # Create temporary database file
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    # Setup database (mock implementation)
    db = await setup_test_database()

    yield db

    # Cleanup
    await teardown_test_database(db)
    try:
        os.unlink(db_path)
    except:
        pass


# Integration test helpers
async def wait_for_service(url: str, timeout: int = 30, interval: int = 1):
    """Wait for service to be available"""
    import aiohttp

    start_time = datetime.now(timezone.utc)

    async with aiohttp.ClientSession() as session:
        while (datetime.now(timezone.utc) - start_time).seconds < timeout:
            try:
                async with session.get(url) as response:
                    if response.status < 500:  # Service is responding
                        return True
            except:
                pass
            await asyncio.sleep(interval)

    raise TimeoutError(f"Service at {url} not available within {timeout} seconds")


def create_test_server(app, host="127.0.0.1", port=0):
    """Create test server"""
    from aiohttp import web

    async def create_server():
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, host, port)
        await site.start()
        return runner, site

    return create_test_server
