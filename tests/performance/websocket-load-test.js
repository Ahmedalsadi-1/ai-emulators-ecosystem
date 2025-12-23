import { check, sleep } from 'k6';
import { WebSocket } from 'k6/ws';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for WebSocket testing
const wsConnectionRate = new Rate('ws_connections_successful');
const wsMessageRate = new Rate('ws_messages_received');
const wsErrorRate = new Rate('ws_errors');
const wsLatencyTrend = new Trend('ws_message_latency');

export const options = {
  scenarios: {
    // WebSocket connection stress test
    websocket_stress: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
      tags: { test_type: 'websocket_stress' },
    },

    // WebSocket broadcast test
    websocket_broadcast: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'websocket_broadcast' },
    },

    // Real-time collaboration test
    realtime_collaboration: {
      executor: 'constant-vus',
      vus: 20,
      duration: '3m',
      tags: { test_type: 'realtime_collaboration' },
    },
  },

  thresholds: {
    ws_connections_successful: ['rate>0.95'],
    ws_errors: ['rate<0.05'],
    ws_message_latency: ['p(95)<500', 'p(99)<1000'],
  },
};

const WS_BASE_URL = __ENV.WS_BASE_URL || 'ws://localhost:8080';

export default function () {
  // Test different WebSocket scenarios
  const scenario = __ENV.SCENARIO || 'broadcast';

  switch (scenario) {
    case 'stress':
      websocketStressTest();
      break;
    case 'broadcast':
      websocketBroadcastTest();
      break;
    case 'collaboration':
      realtimeCollaborationTest();
      break;
    default:
      websocketBasicTest();
  }
}

function websocketBasicTest() {
  const url = `${WS_BASE_URL}/ws`;

  const res = new WebSocket(url, null, { tags: { test_type: 'websocket_basic' } });

  res.on('open', () => {
    wsConnectionRate.add(true);

    // Send a ping message
    res.send(JSON.stringify({
      type: 'ping',
      timestamp: Date.now(),
      clientId: `client-${__VU}`,
    }));
  });

  res.on('message', (data) => {
    wsMessageRate.add(true);

    try {
      const message = JSON.parse(data);
      if (message.type === 'pong') {
        const latency = Date.now() - message.originalTimestamp;
        wsLatencyTrend.add(latency);
      }
    } catch (error) {
      wsErrorRate.add(true);
    }
  });

  res.on('error', (error) => {
    wsErrorRate.add(true);
    console.error('WebSocket error:', error);
  });

  res.on('close', () => {
    // Connection closed
  });

  // Wait for connection and some messages
  sleep(5);

  res.close();
}

function websocketStressTest() {
  const url = `${WS_BASE_URL}/ws`;

  const res = new WebSocket(url, null, { tags: { test_type: 'websocket_stress' } });

  res.on('open', () => {
    wsConnectionRate.add(true);

    // Send periodic messages to stress the connection
    const intervalId = setInterval(() => {
      res.send(JSON.stringify({
        type: 'stress_message',
        data: `VU ${__VU} message at ${Date.now()}`,
        sequence: Math.random(),
      }));
    }, 100); // Send message every 100ms

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(intervalId);
      res.close();
    }, 30000);
  });

  res.on('message', (data) => {
    wsMessageRate.add(true);

    try {
      const message = JSON.parse(data);
      if (message.type === 'stress_response') {
        const latency = Date.now() - message.timestamp;
        wsLatencyTrend.add(latency);
      }
    } catch (error) {
      wsErrorRate.add(true);
    }
  });

  res.on('error', (error) => {
    wsErrorRate.add(true);
  });

  // Wait for the test duration
  sleep(35);
}

function websocketBroadcastTest() {
  const url = `${WS_BASE_URL}/ws`;

  const res = new WebSocket(url, null, { tags: { test_type: 'websocket_broadcast' } });

  res.on('open', () => {
    wsConnectionRate.add(true);

    // Join a broadcast channel
    res.send(JSON.stringify({
      type: 'join_channel',
      channel: 'broadcast-test',
      clientId: `client-${__VU}`,
    }));

    // Send broadcast messages periodically
    const intervalId = setInterval(() => {
      res.send(JSON.stringify({
        type: 'broadcast',
        channel: 'broadcast-test',
        message: `Broadcast from VU ${__VU} at ${Date.now()}`,
        sender: `client-${__VU}`,
      }));
    }, 500); // Send broadcast every 500ms

    // Stop after 45 seconds
    setTimeout(() => {
      clearInterval(intervalId);
      res.close();
    }, 45000);
  });

  res.on('message', (data) => {
    wsMessageRate.add(true);

    try {
      const message = JSON.parse(data);
      if (message.type === 'broadcast_received') {
        const latency = Date.now() - message.originalTimestamp;
        wsLatencyTrend.add(latency);
      }
    } catch (error) {
      wsErrorRate.add(true);
    }
  });

  res.on('error', (error) => {
    wsErrorRate.add(true);
  });

  // Wait for the test duration
  sleep(50);
}

function realtimeCollaborationTest() {
  const url = `${WS_BASE_URL}/ws`;

  const res = new WebSocket(url, null, { tags: { test_type: 'realtime_collaboration' } });

  res.on('open', () => {
    wsConnectionRate.add(true);

    // Join a collaboration session
    res.send(JSON.stringify({
      type: 'join_session',
      sessionId: 'collaboration-test-session',
      clientId: `client-${__VU}`,
      userId: `user-${__VU}`,
    }));

    // Simulate collaborative editing
    let editCount = 0;
    const intervalId = setInterval(() => {
      editCount++;
      res.send(JSON.stringify({
        type: 'edit',
        sessionId: 'collaboration-test-session',
        userId: `user-${__VU}`,
        editId: `edit-${editCount}`,
        operation: {
          type: 'insert',
          position: Math.floor(Math.random() * 1000),
          text: `Text from VU ${__VU} edit ${editCount}`,
        },
        timestamp: Date.now(),
      }));
    }, 200); // Edit every 200ms

    // Simulate cursor movements
    const cursorIntervalId = setInterval(() => {
      res.send(JSON.stringify({
        type: 'cursor_move',
        sessionId: 'collaboration-test-session',
        userId: `user-${__VU}`,
        position: Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
      }));
    }, 100); // Cursor move every 100ms

    // Stop after 2 minutes
    setTimeout(() => {
      clearInterval(intervalId);
      clearInterval(cursorIntervalId);
      res.close();
    }, 120000);
  });

  res.on('message', (data) => {
    wsMessageRate.add(true);

    try {
      const message = JSON.parse(data);
      if (message.type === 'edit_acknowledged' || message.type === 'cursor_updated') {
        const latency = Date.now() - message.timestamp;
        wsLatencyTrend.add(latency);
      }
    } catch (error) {
      wsErrorRate.add(true);
    }
  });

  res.on('error', (error) => {
    wsErrorRate.add(true);
  });

  // Wait for the test duration
  sleep(130);
}

export function teardown() {
  console.log('WebSocket performance test completed');
  console.log(`WebSocket connections successful: ${wsConnectionRate}`);
  console.log(`Messages received: ${wsMessageRate}`);
  console.log(`Errors: ${wsErrorRate}`);
  console.log(`Message latency: ${wsLatencyTrend}`);
}