#!/usr/bin/env node

/**
 * Test script for Kali Desktop MCP Server
 * Validates basic functionality and AI capabilities
 */

const { spawn } = require('child_process');
const http = require('http');

async function testMCPServer() {
    console.log('🧪 Testing Kali Desktop MCP Server...\n');

    // Test 1: Check if server starts
    console.log('1. Testing server startup...');
    const serverProcess = spawn('node', ['kali-mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000
    });

    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
        console.log('Server stderr:', data.toString());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Check MCP initialization
    console.log('2. Testing MCP initialization...');
    try {
        const response = await makeMCPRequest('initialize', {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            clientInfo: { name: "test-client", version: "1.0.0" }
        });

        if (response.result && response.result.capabilities) {
            console.log('✅ MCP initialization successful');
        } else {
            console.log('❌ MCP initialization failed');
        }
    } catch (error) {
        console.log('❌ MCP initialization error:', error.message);
    }

    // Test 3: Check tool listing
    console.log('3. Testing tool listing...');
    try {
        const response = await makeMCPRequest('tools/list', {});

        if (response.result && response.result.tools) {
            console.log(`✅ Found ${response.result.tools.length} tools:`);
            response.result.tools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });

            // Verify AI tools are present
            const aiTools = ['kali_click_element', 'kali_hawkeye_pinpoint', 'kali_ai_interact', 'kali_security_scan'];
            const present = aiTools.filter(tool => response.result.tools.some(t => t.name === tool));

            console.log(`✅ AI-enhanced tools present: ${present.length}/${aiTools.length}`);
        } else {
            console.log('❌ Tool listing failed');
        }
    } catch (error) {
        console.log('❌ Tool listing error:', error.message);
    }

    // Cleanup
    serverProcess.kill();
    console.log('\n🏁 Test completed');
}

function makeMCPRequest(method, params) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: method,
            params: params
        });

        const options = {
            hostname: '127.0.0.1',
            port: 3019, // MCP server port
            path: '/mcp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Run tests if called directly
if (require.main === module) {
    testMCPServer().catch(console.error);
}

module.exports = { testMCPServer };