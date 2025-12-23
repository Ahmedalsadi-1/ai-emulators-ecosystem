"""
Embedded UI Integration Tests

Tests embedded UI components, widget integrations, UI state management,
and cross-origin communication across different embedding contexts.
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional, Callable
import playwright.async_api as playwright
from playwright.async_api import Page, Browser, BrowserContext

# Import shared testing utilities
from testing_utils import (
    mock_auth_service,
    generate_test_user,
    generate_test_agent,
    generate_test_workflow,
    mock_post_message,
)


class TestEmbeddedWidgetIntegration:
    """Test embedded widget integration across different contexts"""

    @pytest.fixture
    async def browser_context(self):
        """Browser context for UI testing"""
        playwright = pytest.importorskip("playwright")
        browser = await playwright.chromium.launch()
        context = await browser.new_context()
        yield context
        await context.close()
        await browser.close()

    @pytest.fixture
    async def embedded_page(self, browser_context):
        """Page with embedded widget"""
        page = await browser_context.new_page()
        await page.goto("http://localhost:3000/embedded-test")
        yield page
        await page.close()

    @pytest.mark.asyncio
    async def test_widget_initialization(self, embedded_page):
        """Test embedded widget initialization"""
        # Wait for widget to load
        await embedded_page.wait_for_selector('.embedded-widget')

        # Verify widget is present and initialized
        widget = embedded_page.locator('.embedded-widget')
        assert await widget.is_visible()

        # Check initialization data
        init_data = await embedded_page.evaluate("""
            () => window.embeddedWidget?.getInitializationData()
        """)

        assert init_data is not None
        assert 'widgetId' in init_data
        assert 'parentOrigin' in init_data
        assert init_data['initialized'] is True

    @pytest.mark.asyncio
    async def test_widget_configuration_loading(self, embedded_page):
        """Test widget configuration loading from parent"""
        # Simulate parent sending configuration
        config = {
            'theme': 'dark',
            'language': 'en',
            'features': ['notifications', 'auto-refresh'],
            'permissions': ['read', 'write']
        }

        await embedded_page.evaluate(f"""
            window.postMessage({{
                type: 'widget.configure',
                config: {json.dumps(config)}
            }}, '*');
        """)

        # Wait for configuration to be applied
        await embedded_page.wait_for_function("""
            () => window.embeddedWidget?.config?.theme === 'dark'
        """)

        # Verify configuration was applied
        applied_config = await embedded_page.evaluate("""
            () => window.embeddedWidget?.config
        """)

        assert applied_config['theme'] == 'dark'
        assert applied_config['language'] == 'en'
        assert 'notifications' in applied_config['features']

    @pytest.mark.asyncio
    async def test_widget_authentication_handling(self, embedded_page):
        """Test authentication token handling in embedded widgets"""
        # Simulate parent providing auth token
        auth_token = 'embedded-widget-token-123'

        await embedded_page.evaluate(f"""
            window.postMessage({{
                type: 'widget.authenticate',
                token: '{auth_token}',
                user: {{
                    id: 'user-123',
                    role: 'admin',
                    permissions: ['read', 'write']
                }}
            }}, '*');
        """)

        # Verify widget received and stored auth data
        auth_data = await embedded_page.evaluate("""
            () => window.embeddedWidget?.auth
        """)

        assert auth_data['token'] == auth_token
        assert auth_data['user']['id'] == 'user-123'
        assert auth_data['user']['role'] == 'admin'

    @pytest.mark.asyncio
    async def test_widget_data_synchronization(self, embedded_page):
        """Test data synchronization between widget and parent"""
        # Widget requests data from parent
        await embedded_page.evaluate("""
            window.embeddedWidget?.requestData('user-profile');
        """)

        # Simulate parent responding with data
        profile_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'preferences': {'theme': 'light', 'notifications': true}
        }

        await embedded_page.evaluate(f"""
            window.postMessage({{
                type: 'widget.data',
                requestId: 'user-profile',
                data: {json.dumps(profile_data)}
            }}, '*');
        """)

        # Verify widget received and processed data
        received_data = await embedded_page.evaluate("""
            () => window.embeddedWidget?.data?.['user-profile']
        """)

        assert received_data['name'] == 'John Doe'
        assert received_data['email'] == 'john@example.com'
        assert received_data['preferences']['theme'] == 'light'

    @pytest.mark.asyncio
    async def test_widget_event_propagation(self, embedded_page):
        """Test event propagation from widget to parent"""
        # Listen for messages from widget
        messages = []
        embedded_page.on('console', lambda msg: messages.append(msg.text))

        # Trigger action in widget
        await embedded_page.evaluate("""
            window.embeddedWidget?.triggerAction('save-data', { key: 'value' });
        """)

        # Verify event was sent to parent
        await embedded_page.wait_for_function("""
            () => window.postMessageHistory?.length > 0
        """)

        post_messages = await embedded_page.evaluate("""
            () => window.postMessageHistory || []
        """)

        assert len(post_messages) > 0
        save_message = next((msg for msg in post_messages if msg.type === 'widget.action'), None)
        assert save_message is not None
        assert save_message.action === 'save-data'
        assert save_message.data.key === 'value'

    @pytest.mark.asyncio
    async def test_widget_responsive_design(self, embedded_page):
        """Test widget responsiveness across different container sizes"""
        # Test different container sizes
        sizes = [
            {'width': 320, 'height': 480},   # Mobile
            {'width': 768, 'height': 1024},  # Tablet
            {'width': 1200, 'height': 800},  # Desktop
        ]

        for size in sizes:
            await embedded_page.set_viewport_size(size)

            # Wait for responsive adjustments
            await embedded_page.wait_for_timeout(500)

            # Verify widget adapted to size
            widget_size = await embedded_page.evaluate("""
                () => {
                    const widget = document.querySelector('.embedded-widget');
                    return {
                        width: widget.offsetWidth,
                        height: widget.offsetHeight,
                        layout: widget.className.includes('mobile') ? 'mobile' :
                               widget.className.includes('tablet') ? 'tablet' : 'desktop'
                    };
                }
            """)

            assert widget_size['width'] <= size['width']
            assert widget_size['height'] <= size['height']

            # Verify appropriate layout class
            if size['width'] < 768:
                assert widget_size['layout'] == 'mobile'
            elif size['width'] < 1200:
                assert widget_size['layout'] == 'tablet'
            else:
                assert widget_size['layout'] == 'desktop'

    @pytest.mark.asyncio
    async def test_widget_error_handling(self, embedded_page):
        """Test widget error handling and recovery"""
        # Trigger error condition
        await embedded_page.evaluate("""
            window.embeddedWidget?.simulateError('network-error');
        """)

        # Verify error state
        error_state = await embedded_page.evaluate("""
            () => window.embeddedWidget?.error
        """)

        assert error_state is not None
        assert 'network-error' in error_state['type']

        # Verify error UI is displayed
        error_element = embedded_page.locator('.widget-error')
        assert await error_element.is_visible()

        # Test error recovery
        await embedded_page.evaluate("""
            window.embeddedWidget?.retry();
        """)

        # Verify error state cleared
        await embedded_page.wait_for_function("""
            () => !window.embeddedWidget?.error
        """)

        recovered_state = await embedded_page.evaluate("""
            () => window.embeddedWidget?.error
        """)

        assert recovered_state is None

    @pytest.mark.asyncio
    async def test_widget_cross_origin_communication(self, browser_context):
        """Test cross-origin communication security"""
        # Create pages from different origins
        page1 = await browser_context.new_page()
        page2 = await browser_context.new_page()

        await page1.goto("http://localhost:3000/widget-host")
        await page2.goto("http://localhost:3001/widget-host")

        # Test same-origin communication (should work)
        await page1.evaluate("""
            window.postMessage({ type: 'test', data: 'same-origin' }, window.location.origin);
        """)

        received_same_origin = await page1.evaluate("""
            return new Promise(resolve => {
                window.addEventListener('message', (event) => {
                    if (event.origin === window.location.origin) {
                        resolve(event.data);
                    }
                });
            });
        """)

        assert received_same_origin['data'] == 'same-origin'

        # Test cross-origin communication (should be blocked)
        await page1.evaluate("""
            window.postMessage({ type: 'test', data: 'cross-origin' }, 'http://localhost:3001');
        """)

        # Verify message was not received (due to CORS)
        cross_origin_received = await page2.evaluate("""
            return new Promise(resolve => {
                setTimeout(() => resolve(null), 1000);
                window.addEventListener('message', (event) => {
                    if (event.origin === 'http://localhost:3000') {
                        resolve(event.data);
                    }
                });
            });
        """)

        assert cross_origin_received is None

        await page1.close()
        await page2.close()


class TestWidgetStateManagement:
    """Test widget state management and synchronization"""

    @pytest.fixture
    async def stateful_widget(self, embedded_page):
        """Widget with state management"""
        await embedded_page.evaluate("""
            window.statefulWidget = {
                state: { counter: 0, items: [] },
                listeners: [],

                setState(updates) {
                    this.state = { ...this.state, ...updates };
                    this.listeners.forEach(listener => listener(this.state));
                    this.persistState();
                },

                subscribe(listener) {
                    this.listeners.push(listener);
                },

                persistState() {
                    localStorage.setItem('widget-state', JSON.stringify(this.state));
                },

                loadState() {
                    const saved = localStorage.getItem('widget-state');
                    if (saved) {
                        this.state = JSON.parse(saved);
                    }
                }
            };

            window.statefulWidget.loadState();
        """)

        return embedded_page

    @pytest.mark.asyncio
    async def test_widget_state_persistence(self, stateful_widget):
        """Test widget state persistence across sessions"""
        # Set initial state
        await stateful_widget.evaluate("""
            window.statefulWidget.setState({ counter: 5, items: ['item1', 'item2'] });
        """)

        # Reload page (simulate new session)
        await stateful_widget.reload()

        # Verify state was persisted and restored
        restored_state = await stateful_widget.evaluate("""
            return window.statefulWidget?.state;
        """)

        assert restored_state['counter'] == 5
        assert restored_state['items'] == ['item1', 'item2']

    @pytest.mark.asyncio
    async def test_widget_state_synchronization(self, stateful_widget):
        """Test state synchronization with parent application"""
        # Subscribe to state changes
        state_changes = []
        await stateful_widget.evaluate("""
            window.statefulWidget.subscribe((state) => {
                window.postMessage({
                    type: 'widget.state-changed',
                    state: state
                }, '*');
            });
        """)

        # Listen for state change messages
        messages = []
        def on_message(msg):
            try:
                data = json.loads(msg.text)
                if data.get('type') == 'widget.state-changed':
                    messages.append(data)
            except:
                pass

        stateful_widget.on('console', on_message)

        # Update widget state
        await stateful_widget.evaluate("""
            window.statefulWidget.setState({ counter: 10 });
        """)

        # Wait for state change message
        await stateful_widget.wait_for_timeout(500)

        # Verify state change was communicated
        assert len(messages) > 0
        assert messages[-1]['state']['counter'] == 10

    @pytest.mark.asyncio
    async def test_widget_bulk_state_updates(self, stateful_widget):
        """Test bulk state updates and conflict resolution"""
        # Perform multiple rapid state updates
        for i in range(10):
            await stateful_widget.evaluate(f"""
                window.statefulWidget.setState({{ counter: {i}, item{i}: 'value{i}' }});
            """)

        # Verify final state contains all updates
        final_state = await stateful_widget.evaluate("""
            return window.statefulWidget.state;
        """)

        assert final_state['counter'] == 9  # Last update wins
        assert final_state['item9'] == 'value9'
        assert final_state['item0'] == 'value0'  # Earlier items preserved

    @pytest.mark.asyncio
    async def test_widget_state_validation(self, stateful_widget):
        """Test state validation and constraint enforcement"""
        # Try to set invalid state (negative counter)
        await stateful_widget.evaluate("""
            window.statefulWidget.setState({ counter: -5 });
        """)

        # Verify state was rejected or corrected
        state_after_invalid = await stateful_widget.evaluate("""
            return window.statefulWidget.state;
        """)

        # State should either reject invalid values or correct them
        assert state_after_invalid['counter'] >= 0

    @pytest.mark.asyncio
    async def test_widget_concurrent_state_access(self, stateful_widget):
        """Test concurrent state access and race condition handling"""
        # Simulate concurrent state updates
        update_promises = []
        for i in range(5):
            promise = stateful_widget.evaluate(f"""
                return new Promise(resolve => {{
                    setTimeout(() => {{
                        window.statefulWidget.setState({{ update{i}: {i} }});
                        resolve(window.statefulWidget.state);
                    }}, {i * 10});
                }});
            """)
            update_promises.append(promise)

        # Wait for all updates to complete
        results = await asyncio.gather(*update_promises)

        # Verify all updates were applied
        final_state = results[-1]  # Last result should have all updates
        for i in range(5):
            assert f'update{i}' in final_state
            assert final_state[f'update{i}'] == i


class TestEmbeddedWidgetSecurity:
    """Test security aspects of embedded widgets"""

    @pytest.mark.asyncio
    async def test_widget_origin_validation(self, embedded_page):
        """Test widget validates message origins"""
        # Send message from allowed origin
        await embedded_page.evaluate("""
            window.postMessage({
                type: 'widget.configure',
                config: { theme: 'dark' }
            }, 'http://localhost:3000');
        """)

        # Verify message was accepted
        config_applied = await embedded_page.evaluate("""
            return window.embeddedWidget?.config?.theme === 'dark';
        """)

        assert config_applied is True

        # Send message from disallowed origin
        await embedded_page.evaluate("""
            window.postMessage({
                type: 'widget.configure',
                config: { theme: 'light' }
            }, 'http://malicious-site.com');
        """)

        # Verify message was rejected
        config_unchanged = await embedded_page.evaluate("""
            return window.embeddedWidget?.config?.theme === 'dark';
        """)

        assert config_unchanged is True

    @pytest.mark.asyncio
    async def test_widget_xss_prevention(self, embedded_page):
        """Test XSS prevention in widget content"""
        # Try to inject malicious script
        malicious_content = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

        await embedded_page.evaluate(f"""
            window.postMessage({{
                type: 'widget.update-content',
                content: '{malicious_content}'
            }}, '*');
        """)

        # Verify malicious content was sanitized
        rendered_content = await embedded_page.evaluate("""
            return document.querySelector('.widget-content')?.innerHTML;
        """)

        assert '<script>' not in rendered_content
        assert 'onerror' not in rendered_content
        assert 'alert' not in rendered_content

    @pytest.mark.asyncio
    async def test_widget_csrf_protection(self, embedded_page):
        """Test CSRF protection for widget actions"""
        # Attempt action without valid CSRF token
        await embedded_page.evaluate("""
            window.postMessage({
                type: 'widget.action',
                action: 'delete-data',
                data: { id: '123' }
            }, '*');
        """)

        # Verify action was blocked
        action_blocked = await embedded_page.evaluate("""
            return window.embeddedWidget?.lastAction?.blocked === true;
        """)

        assert action_blocked is True

        # Attempt action with valid CSRF token
        valid_token = await embedded_page.evaluate("""
            return window.embeddedWidget?.csrfToken;
        """)

        await embedded_page.evaluate(f"""
            window.postMessage({{
                type: 'widget.action',
                action: 'delete-data',
                data: {{ id: '123' }},
                csrfToken: '{valid_token}'
            }}, '*');
        """)

        # Verify action was allowed
        action_allowed = await embedded_page.evaluate("""
            return window.embeddedWidget?.lastAction?.allowed === true;
        """)

        assert action_allowed is True

    @pytest.mark.asyncio
    async def test_widget_permission_enforcement(self, embedded_page):
        """Test permission enforcement in widget actions"""
        # Set user permissions
        await embedded_page.evaluate("""
            window.embeddedWidget?.setPermissions(['read', 'write']);
        """)

        # Try allowed action
        await embedded_page.evaluate("""
            window.embeddedWidget?.performAction('write-data', { data: 'test' });
        """)

        # Verify action succeeded
        action_result = await embedded_page.evaluate("""
            return window.embeddedWidget?.lastActionResult;
        """)

        assert action_result['success'] is True

        # Try disallowed action
        await embedded_page.evaluate("""
            window.embeddedWidget?.performAction('admin-action', { data: 'test' });
        """)

        # Verify action was blocked
        blocked_result = await embedded_page.evaluate("""
            return window.embeddedWidget?.lastActionResult;
        """)

        assert blocked_result['success'] is False
        assert 'permission' in blocked_result['error'].lower()


class TestWidgetPerformanceAndReliability:
    """Test widget performance and reliability"""

    @pytest.mark.asyncio
    async def test_widget_load_performance(self, embedded_page):
        """Test widget load performance metrics"""
        # Measure widget initialization time
        load_metrics = await embedded_page.evaluate("""
            return new Promise(resolve => {
                const startTime = performance.now();

                const checkLoaded = () => {
                    if (window.embeddedWidget?.initialized) {
                        const endTime = performance.now();
                        resolve({
                            loadTime: endTime - startTime,
                            initialized: true
                        });
                    } else {
                        setTimeout(checkLoaded, 10);
                    }
                };

                checkLoaded();
            });
        """)

        assert load_metrics['initialized'] is True
        assert load_metrics['loadTime'] < 5000  # Should load within 5 seconds

    @pytest.mark.asyncio
    async def test_widget_memory_usage(self, embedded_page):
        """Test widget memory usage and leaks"""
        # Get initial memory usage
        initial_memory = await embedded_page.evaluate("""
            return performance.memory?.usedJSHeapSize || 0;
        """)

        # Perform memory-intensive operations
        await embedded_page.evaluate("""
            window.testData = [];
            for (let i = 0; i < 10000; i++) {
                window.testData.push({ id: i, data: 'x'.repeat(100) });
            }
        """)

        # Trigger garbage collection (if available)
        await embedded_page.evaluate("""
            if (window.gc) window.gc();
        """)

        # Clean up test data
        await embedded_page.evaluate("""
            window.testData = null;
        """)

        # Check memory after cleanup
        final_memory = await embedded_page.evaluate("""
            return performance.memory?.usedJSHeapSize || 0;
        """)

        # Memory should not have grown significantly after cleanup
        memory_growth = final_memory - initial_memory
        assert memory_growth < 10 * 1024 * 1024  # Less than 10MB growth

    @pytest.mark.asyncio
    async def test_widget_error_recovery(self, embedded_page):
        """Test widget error recovery mechanisms"""
        # Simulate widget crash
        await embedded_page.evaluate("""
            window.embeddedWidget?.simulateCrash();
        """)

        # Verify error state
        error_state = await embedded_page.evaluate("""
            return window.embeddedWidget?.crashed;
        """)

        assert error_state is True

        # Test recovery
        await embedded_page.evaluate("""
            window.embeddedWidget?.recover();
        """)

        # Verify recovery
        await embedded_page.wait_for_function("""
            return !window.embeddedWidget?.crashed && window.embeddedWidget?.initialized;
        """)

        recovered_state = await embedded_page.evaluate("""
            return {
                crashed: window.embeddedWidget?.crashed,
                initialized: window.embeddedWidget?.initialized
            };
        """)

        assert recovered_state['crashed'] is False
        assert recovered_state['initialized'] is True

    @pytest.mark.asyncio
    async def test_widget_concurrent_operations(self, embedded_page):
        """Test widget handling of concurrent operations"""
        # Start multiple concurrent operations
        operations = []
        for i in range(10):
            operation = embedded_page.evaluate(f"""
                return window.embeddedWidget?.performAsyncOperation({i});
            """)
            operations.append(operation)

        # Wait for all operations to complete
        results = await asyncio.gather(*operations)

        # Verify all operations completed successfully
        assert len(results) == 10
        for result in results:
            assert result['success'] is True

        # Verify no race conditions in internal state
        final_state = await embedded_page.evaluate("""
            return window.embeddedWidget?.internalState;
        """)

        assert final_state['concurrentOperations'] == 0  # All completed
        assert final_state['operationCount'] == 10