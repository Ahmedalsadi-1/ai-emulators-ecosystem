"""
Cross-Communication Integration Tests

Tests inter-service communication, WebSocket connections, API calls,
message queues, and data flow between different parts of the unified ecosystem.
"""

import pytest
import asyncio
import json
import aiohttp
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional, Callable
import websockets
import redis
from datetime import datetime, timezone

# Import shared testing utilities
from testing_utils import (
    mock_service_communication,
    create_mock_websocket_server,
    create_mock_websocket_client,
    wait_for_service,
    setup_test_database,
    generate_test_user,
    generate_test_agent,
    generate_test_workflow,
)


class TestWebSocketCommunication:
    """Test WebSocket-based cross-service communication"""

    @pytest.fixture
    async def websocket_server(self):
        """Mock WebSocket server for testing"""
        return create_mock_websocket_server()

    @pytest.fixture
    async def websocket_client(self):
        """Mock WebSocket client for testing"""
        return create_mock_websocket_client()

    @pytest.mark.asyncio
    async def test_websocket_connection_establishment(
        self, websocket_server, websocket_client
    ):
        """Test WebSocket connection establishment and handshake"""
        # Simulate connection establishment
        await websocket_client.connect("ws://localhost:8080")

        assert websocket_client.readyState == 1  # OPEN
        assert websocket_server.clients.size > 0

        # Test connection cleanup
        await websocket_client.close()
        assert websocket_client.readyState == 3  # CLOSED

    @pytest.mark.asyncio
    async def test_websocket_message_broadcasting(
        self, websocket_server, websocket_client
    ):
        """Test WebSocket message broadcasting to multiple clients"""
        # Connect multiple clients
        client1 = create_mock_websocket_client()
        client2 = create_mock_websocket_client()
        client3 = create_mock_websocket_client()

        await client1.connect("ws://localhost:8080")
        await client2.connect("ws://localhost:8080")
        await client3.connect("ws://localhost:8080")

        # Broadcast message to all clients
        message = {"type": "broadcast", "data": "Hello all clients"}
        await websocket_server.broadcast(message)

        # Verify all clients received the message
        assert client1.received_messages[-1] == message
        assert client2.received_messages[-1] == message
        assert client3.received_messages[-1] == message

    @pytest.mark.asyncio
    async def test_websocket_room_based_communication(self, websocket_server):
        """Test room-based WebSocket communication"""
        # Create room-based communication
        room_manager = websocket_server.create_room_manager()

        # Clients join different rooms
        client1 = create_mock_websocket_client()
        client2 = create_mock_websocket_client()
        client3 = create_mock_websocket_client()

        await room_manager.join_room(client1, "room-a")
        await room_manager.join_room(client2, "room-a")
        await room_manager.join_room(client3, "room-b")

        # Send message to room-a
        message = {"type": "room-message", "data": "Hello room-a"}
        await room_manager.broadcast_to_room("room-a", message)

        # Verify only room-a clients received the message
        assert client1.received_messages[-1] == message
        assert client2.received_messages[-1] == message
        assert len(client3.received_messages) == 0  # Not in room-a

    @pytest.mark.asyncio
    async def test_websocket_reconnection_handling(self, websocket_server):
        """Test WebSocket reconnection scenarios"""
        client = create_mock_websocket_client()

        # Initial connection
        await client.connect("ws://localhost:8080")
        assert client.readyState == 1

        # Simulate disconnection
        await client.simulate_disconnect()
        assert client.readyState == 3

        # Reconnection attempt
        await client.reconnect()
        assert client.readyState == 1

        # Verify reconnection event was emitted
        assert len(websocket_server.reconnection_events) > 0

    @pytest.mark.asyncio
    async def test_websocket_authentication_handling(self, websocket_server):
        """Test WebSocket connection with authentication"""
        client = create_mock_websocket_client()

        # Attempt connection without auth
        with pytest.raises(Exception, match="Authentication required"):
            await client.connect("ws://localhost:8080")

        # Connection with valid auth token
        auth_token = "valid-websocket-token"
        await client.connect(
            "ws://localhost:8080", headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert client.readyState == 1
        assert client.authenticated is True

    @pytest.mark.asyncio
    async def test_websocket_heartbeat_mechanism(
        self, websocket_server, websocket_client
    ):
        """Test WebSocket heartbeat/ping-pong mechanism"""
        await websocket_client.connect("ws://localhost:8080")

        # Enable heartbeat
        websocket_client.enable_heartbeat(interval=30)

        # Wait for heartbeat cycles
        await asyncio.sleep(0.1)  # Let heartbeats run

        # Verify heartbeat messages were sent
        ping_messages = [
            msg for msg in websocket_client.sent_messages if msg.get("type") == "ping"
        ]
        assert len(ping_messages) > 0

        # Simulate pong response
        await websocket_server.send_pong(websocket_client)

        # Verify connection remains alive
        assert websocket_client.readyState == 1
        assert websocket_client.missed_heartbeats == 0


class TestAPICrossCommunication:
    """Test API-based cross-service communication"""

    @pytest.fixture
    async def http_client(self):
        """HTTP client for API testing"""
        async with aiohttp.ClientSession() as session:
            yield session

    @pytest.mark.asyncio
    async def test_service_to_service_api_calls(self, http_client):
        """Test direct API calls between services"""
        # Mock service endpoints
        service_a_url = "http://service-a:3000"
        service_b_url = "http://service-b:3001"

        # Service A calls Service B
        async with http_client.post(
            f"{service_b_url}/api/endpoint",
            json={"data": "from service a"},
            headers={"X-Service-Caller": "service-a"},
        ) as response:
            assert response.status == 200
            result = await response.json()
            assert result["processed_by"] == "service-b"
            assert result["caller"] == "service-a"

    @pytest.mark.asyncio
    async def test_api_gateway_routing(self, http_client):
        """Test API gateway routing to multiple services"""
        gateway_url = "http://api-gateway:8080"

        # Route to different services through gateway
        services = ["users", "orders", "inventory"]

        for service in services:
            async with http_client.get(
                f"{gateway_url}/api/{service}/health"
            ) as response:
                assert response.status == 200
                health = await response.json()
                assert health["service"] == service
                assert health["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_load_balanced_requests(self, http_client):
        """Test load balancing across service instances"""
        service_url = "http://load-balancer:8080"

        # Make multiple requests to load-balanced service
        responses = []
        for i in range(10):
            async with http_client.get(f"{service_url}/api/data") as response:
                responses.append(await response.json())

        # Verify requests were distributed across instances
        instance_ids = set(resp["instance_id"] for resp in responses)
        assert len(instance_ids) > 1  # Multiple instances used

    @pytest.mark.asyncio
    async def test_circuit_breaker_pattern(self, http_client):
        """Test circuit breaker pattern for resilient communication"""
        failing_service_url = "http://failing-service:3000"

        # Initial successful requests
        for i in range(3):
            async with http_client.get(f"{failing_service_url}/api/data") as response:
                assert response.status == 200

        # Simulate service failure
        # Circuit breaker should open after threshold failures
        for i in range(5):
            try:
                async with http_client.get(
                    f"{failing_service_url}/api/data", timeout=1
                ) as response:
                    pass  # Should fail
            except asyncio.TimeoutError:
                pass  # Expected timeout

        # Circuit should be open - fast-fail responses
        async with http_client.get(f"{failing_service_url}/api/data") as response:
            assert response.status == 503  # Service Unavailable (circuit open)

    @pytest.mark.asyncio
    async def test_service_discovery_integration(self, http_client):
        """Test service discovery and dynamic endpoint resolution"""
        discovery_url = "http://service-discovery:8500"

        # Register service
        registration_data = {
            "name": "dynamic-service",
            "address": "10.0.0.1",
            "port": 8080,
            "tags": ["api", "v1"],
        }

        async with http_client.put(
            f"{discovery_url}/v1/agent/service/register", json=registration_data
        ) as response:
            assert response.status == 200

        # Discover service
        async with http_client.get(
            f"{discovery_url}/v1/health/service/dynamic-service"
        ) as response:
            assert response.status == 200
            health = await response.json()
            assert len(health) > 0

        # Use discovered service
        service_instances = health
        instance = service_instances[0]
        service_url = (
            f"http://{instance['Service']['Address']}:{instance['Service']['Port']}"
        )

        async with http_client.get(f"{service_url}/api/info") as response:
            assert response.status == 200
            info = await response.json()
            assert info["service"] == "dynamic-service"


class TestMessageQueueCommunication:
    """Test message queue-based cross-service communication"""

    @pytest.fixture
    async def redis_client(self):
        """Redis client for message queue testing"""
        client = redis.Redis(host="localhost", port=6379, decode_responses=True)
        yield client
        await client.aclose()

    @pytest.fixture
    async def message_queue(self, redis_client):
        """Message queue instance"""
        queue = Mock()
        queue.redis = redis_client
        queue.publish = AsyncMock()
        queue.subscribe = AsyncMock()
        queue.consume = AsyncMock()
        return queue

    @pytest.mark.asyncio
    async def test_message_publishing_and_consumption(self, message_queue):
        """Test message publishing and consumption via queues"""
        queue_name = "test-queue"
        message = {
            "type": "user.created",
            "user_id": "123",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Publish message
        await message_queue.publish(queue_name, message)

        # Verify message was published
        message_queue.publish.assert_called_with(queue_name, message)

        # Consume message
        consumed_messages = []
        await message_queue.consume(
            queue_name, lambda msg: consumed_messages.append(msg)
        )

        # Verify message was consumed
        assert len(consumed_messages) == 1
        assert consumed_messages[0] == message

    @pytest.mark.asyncio
    async def test_topic_based_messaging(self, message_queue):
        """Test topic-based publish/subscribe messaging"""
        topic = "user-events"

        # Subscribe to topic
        subscriber1 = Mock()
        subscriber2 = Mock()

        await message_queue.subscribe(topic, subscriber1.callback)
        await message_queue.subscribe(topic, subscriber2.callback)

        # Publish to topic
        message = {"event": "user.login", "user_id": "456"}
        await message_queue.publish_topic(topic, message)

        # Verify both subscribers received the message
        subscriber1.callback.assert_called_with(message)
        subscriber2.callback.assert_called_with(message)

    @pytest.mark.asyncio
    async def test_message_acknowledgment_and_retry(self, message_queue):
        """Test message acknowledgment and retry mechanisms"""
        queue_name = "retry-queue"

        # Message that fails processing initially
        message = {"type": "email.send", "email_id": "789"}
        failure_count = 0

        async def failing_processor(msg):
            nonlocal failure_count
            failure_count += 1
            if failure_count < 3:
                raise Exception("Temporary processing failure")
            # Success on third attempt
            return True

        # Process message with retry
        await message_queue.consume_with_retry(
            queue_name, failing_processor, max_retries=3
        )

        # Verify message was retried
        assert failure_count == 3

        # Verify message was acknowledged after success
        message_queue.acknowledge.assert_called_once()

    @pytest.mark.asyncio
    async def test_dead_letter_queue_handling(self, message_queue):
        """Test dead letter queue for failed messages"""
        queue_name = "main-queue"
        dlq_name = "dead-letter-queue"

        # Message that always fails
        message = {"type": "persistent.failure", "data": "test"}

        async def always_failing_processor(msg):
            raise Exception("Permanent failure")

        # Process with DLQ
        await message_queue.consume_with_dlq(
            queue_name, dlq_name, always_failing_processor, max_retries=2
        )

        # Verify message moved to DLQ
        dlq_messages = await message_queue.get_dlq_messages(dlq_name)
        assert len(dlq_messages) == 1
        assert dlq_messages[0]["original_message"] == message
        assert dlq_messages[0]["failure_reason"] == "Permanent failure"


class TestEventDrivenCommunication:
    """Test event-driven cross-service communication"""

    @pytest.fixture
    async def event_bus(self):
        """Event bus for inter-service communication"""
        bus = Mock()
        bus.publish = AsyncMock()
        bus.subscribe = AsyncMock()
        bus.unsubscribe = AsyncMock()
        bus.get_event_history = AsyncMock()
        return bus

    @pytest.mark.asyncio
    async def test_event_publishing_and_handling(self, event_bus):
        """Test event publishing and handling across services"""
        event = {
            "id": "event-123",
            "type": "user.registered",
            "source": "user-service",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {"user_id": "456", "email": "user@example.com"},
        }

        # Publish event
        await event_bus.publish(event)

        # Verify event was published
        event_bus.publish.assert_called_with(event)

        # Subscribe and handle event
        event_handler = Mock()
        await event_bus.subscribe("user.registered", event_handler)

        # Simulate event delivery
        await event_bus.deliver_pending_events()

        # Verify event was handled
        event_handler.assert_called_with(event)

    @pytest.mark.asyncio
    async def test_event_sourcing_and_replay(self, event_bus):
        """Test event sourcing and replay capabilities"""
        # Record sequence of events
        events = [
            {"id": "1", "type": "order.created", "data": {"order_id": "100"}},
            {
                "id": "2",
                "type": "payment.processed",
                "data": {"order_id": "100", "amount": 99.99},
            },
            {"id": "3", "type": "order.shipped", "data": {"order_id": "100"}},
        ]

        for event in events:
            await event_bus.publish(event)

        # Replay events from specific point
        replayed_events = await event_bus.replay_events(from_event_id="2")

        assert len(replayed_events) == 2
        assert replayed_events[0]["id"] == "2"
        assert replayed_events[1]["id"] == "3"

    @pytest.mark.asyncio
    async def test_event_correlation_and_saga(self, event_bus):
        """Test event correlation for saga patterns"""
        correlation_id = "saga-123"

        # Start saga with initial event
        await event_bus.publish(
            {
                "id": "1",
                "correlation_id": correlation_id,
                "type": "saga.started",
                "step": 1,
            }
        )

        # Subsequent correlated events
        for step in [2, 3, 4]:
            await event_bus.publish(
                {
                    "id": str(step),
                    "correlation_id": correlation_id,
                    "type": "saga.step.completed",
                    "step": step,
                }
            )

        # Query events by correlation ID
        saga_events = await event_bus.get_correlated_events(correlation_id)

        assert len(saga_events) == 4
        assert all(event["correlation_id"] == correlation_id for event in saga_events)
        assert saga_events[-1]["step"] == 4

    @pytest.mark.asyncio
    async def test_event_filtering_and_routing(self, event_bus):
        """Test event filtering and routing to specific services"""
        # Set up routing rules
        routing_rules = {
            "user.*": ["user-service", "notification-service"],
            "order.*": ["order-service", "inventory-service"],
            "*.error": ["monitoring-service", "alert-service"],
        }

        await event_bus.configure_routing(routing_rules)

        # Publish events of different types
        events = [
            {"type": "user.created", "data": {"user_id": "1"}},
            {"type": "order.placed", "data": {"order_id": "100"}},
            {"type": "payment.error", "data": {"error": "insufficient funds"}},
        ]

        for event in events:
            await event_bus.publish(event)

        # Verify routing
        published_events = event_bus.publish.call_args_list

        # Check that events were routed to appropriate services
        for call in published_events:
            event = call[0][0]  # First argument
            if event["type"].startswith("user."):
                assert "user-service" in event.get("routed_to", [])
                assert "notification-service" in event.get("routed_to", [])
            elif event["type"].startswith("order."):
                assert "order-service" in event.get("routed_to", [])
                assert "inventory-service" in event.get("routed_to", [])


class TestDataSynchronization:
    """Test data synchronization across services"""

    @pytest.fixture
    async def sync_manager(self):
        """Data synchronization manager"""
        manager = Mock()
        manager.sync_data = AsyncMock()
        manager.get_sync_status = AsyncMock()
        manager.resolve_conflicts = AsyncMock()
        manager.rollback_sync = AsyncMock()
        return manager

    @pytest.mark.asyncio
    async def test_database_replication_sync(self, sync_manager):
        """Test database replication synchronization"""
        source_db = "primary-db"
        target_db = "replica-db"

        # Sync data from primary to replica
        sync_result = await sync_manager.sync_data(
            source_db,
            target_db,
            {"tables": ["users", "orders"], "sync_mode": "incremental"},
        )

        assert sync_result["success"] is True
        assert sync_result["records_synced"] > 0
        assert sync_result["sync_duration"] > 0

        # Verify data consistency
        source_count = await sync_manager.get_record_count(source_db, "users")
        target_count = await sync_manager.get_record_count(target_db, "users")
        assert source_count == target_count

    @pytest.mark.asyncio
    async def test_cache_synchronization(self, sync_manager):
        """Test cache synchronization across services"""
        cache_nodes = ["cache-1", "cache-2", "cache-3"]

        # Update cache in one node
        await sync_manager.update_cache("cache-1", "user:123", {"name": "John"})

        # Sync to other nodes
        for node in cache_nodes[1:]:
            await sync_manager.sync_cache("cache-1", node)

        # Verify all nodes have consistent data
        for node in cache_nodes:
            data = await sync_manager.get_cache(node, "user:123")
            assert data["name"] == "John"

    @pytest.mark.asyncio
    async def test_conflict_resolution(self, sync_manager):
        """Test conflict resolution in data synchronization"""
        # Create conflicting updates
        conflict_data = {
            "record_id": "user-456",
            "conflicts": [
                {
                    "source": "service-a",
                    "data": {"email": "a@example.com"},
                    "timestamp": "2023-01-01T10:00:00Z",
                },
                {
                    "source": "service-b",
                    "data": {"email": "b@example.com"},
                    "timestamp": "2023-01-01T10:05:00Z",
                },
            ],
        }

        # Resolve conflict (last-write-wins strategy)
        resolution = await sync_manager.resolve_conflicts(
            conflict_data, "last-write-wins"
        )

        assert resolution["resolved_email"] == "b@example.com"  # Later timestamp wins
        assert resolution["strategy"] == "last-write-wins"

    @pytest.mark.asyncio
    async def test_incremental_sync_with_change_tracking(self, sync_manager):
        """Test incremental synchronization with change tracking"""
        # Enable change tracking
        await sync_manager.enable_change_tracking("users")

        # Make some changes
        await sync_manager.insert_record("users", {"id": "1", "name": "Alice"})
        await sync_manager.update_record("users", "1", {"name": "Alice Smith"})
        await sync_manager.delete_record("users", "2")

        # Get changes since last sync
        changes = await sync_manager.get_changes_since("users", "2023-01-01T00:00:00Z")

        assert len(changes) == 3
        assert any(c["operation"] == "insert" for c in changes)
        assert any(c["operation"] == "update" for c in changes)
        assert any(c["operation"] == "delete" for c in changes)


class TestCrossServiceIntegration:
    """Integration tests combining multiple communication patterns"""

    @pytest.mark.asyncio
    async def test_complete_user_registration_workflow(self):
        """Test complete user registration workflow across services"""
        # 1. User submits registration (API Gateway)
        registration_data = {
            "email": "newuser@example.com",
            "password": "securepassword",
            "name": "New User",
        }

        # 2. API Gateway routes to User Service
        # 3. User Service creates user and publishes event
        # 4. Event triggers email verification (Notification Service)
        # 5. Event triggers welcome email (Email Service)
        # 6. User data syncs to cache (Cache Service)

        # Mock the entire workflow
        workflow_manager = Mock()
        workflow_manager.register_user = AsyncMock()
        workflow_manager.send_verification_email = AsyncMock()
        workflow_manager.send_welcome_email = AsyncMock()
        workflow_manager.cache_user_data = AsyncMock()

        # Execute workflow
        result = await workflow_manager.register_user(registration_data)

        # Verify all services were called in correct order
        assert result["user_created"] is True
        assert result["verification_sent"] is True
        assert result["welcome_sent"] is True
        assert result["cached"] is True

        # Verify cross-service communication
        workflow_manager.register_user.assert_called_once()
        workflow_manager.send_verification_email.assert_called_once()
        workflow_manager.send_welcome_email.assert_called_once()
        workflow_manager.cache_user_data.assert_called_once()

    @pytest.mark.asyncio
    async def test_service_mesh_communication(self):
        """Test service mesh communication patterns"""
        # Simulate service mesh with sidecars
        service_mesh = Mock()
        service_mesh.route_request = AsyncMock()
        service_mesh.apply_policies = AsyncMock()
        service_mesh.collect_metrics = AsyncMock()

        # Service A calls Service B through mesh
        request = {
            "from": "service-a",
            "to": "service-b",
            "endpoint": "/api/data",
            "method": "GET",
        }

        # Mesh routing with policies
        response = await service_mesh.route_request(request)

        assert response["routed"] is True
        assert response["policies_applied"] is True
        assert response["metrics_collected"] is True

        # Verify observability
        service_mesh.apply_policies.assert_called_once()
        service_mesh.collect_metrics.assert_called_once()

    @pytest.mark.asyncio
    async def test_federated_service_communication(self):
        """Test communication with federated/external services"""
        federation_manager = Mock()
        federation_manager.authenticate_external = AsyncMock()
        federation_manager.translate_protocol = AsyncMock()
        federation_manager.handle_response = AsyncMock()

        # Call external federated service
        external_request = {
            "service": "external-api",
            "endpoint": "/federated/data",
            "protocol": "custom-protocol",
        }

        result = await federation_manager.call_external_service(external_request)

        assert result["authenticated"] is True
        assert result["protocol_translated"] is True
        assert result["response_handled"] is True

        # Verify federation components
        federation_manager.authenticate_external.assert_called_once()
        federation_manager.translate_protocol.assert_called_once()
        federation_manager.handle_response.assert_called_once()
