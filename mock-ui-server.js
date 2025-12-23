#!/usr/bin/env node
/**
 * Mock ByteBot UI Server for Unified Framework Demo
 * Provides a simple web interface to demonstrate the unified dashboard
 */

const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Main dashboard route
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified AI Framework Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .service-card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 15px; 
            padding: 25px; 
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .service-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .service-card h3 { font-size: 1.5rem; margin-bottom: 15px; color: #fff; }
        .service-card p { opacity: 0.9; margin-bottom: 15px; line-height: 1.6; }
        .status { 
            display: inline-block; 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 0.9rem; 
            font-weight: bold;
        }
        .status.online { background: #4CAF50; color: white; }
        .status.offline { background: #f44336; color: white; }
        .status.mock { background: #FF9800; color: white; }
        .links { margin-top: 15px; }
        .links a { 
            display: inline-block; 
            margin-right: 10px; 
            padding: 8px 16px; 
            background: rgba(255,255,255,0.2); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            transition: background 0.3s ease;
        }
        .links a:hover { background: rgba(255,255,255,0.3); }
        .unified-section { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 15px; 
            padding: 30px; 
            margin-top: 30px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .unified-section h2 { margin-bottom: 20px; font-size: 2rem; }
        .feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .feature-item { 
            background: rgba(255,255,255,0.1); 
            padding: 15px; 
            border-radius: 10px; 
            border-left: 4px solid #4CAF50;
        }
        .footer { text-align: center; margin-top: 40px; opacity: 0.8; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Unified AI Framework</h1>
            <p>AIOS + ByteBot + Factif-AI Integration Platform</p>
        </div>

        <div class="services-grid">
            <div class="service-card">
                <h3>🧠 AIOS (AI Operating System)</h3>
                <p>Core AI inference engine and agent orchestration platform providing LLM capabilities and reasoning services.</p>
                <div class="status mock pulse">Mock Service Active</div>
                <div class="links">
                    <a href="http://localhost:8000/health" target="_blank">Health Check</a>
                    <a href="http://localhost:8000/status" target="_blank">System Status</a>
                </div>
            </div>

            <div class="service-card">
                <h3>🤖 ByteBot Agent</h3>
                <p>Open-source AI desktop agent for task automation and intelligent workflow management.</p>
                <div class="status offline">Service Offline</div>
                <div class="links">
                    <a href="http://localhost:9991/api" target="_blank">API Docs</a>
                    <a href="#" onclick="alert('ByteBot Agent is currently offline')">Dashboard</a>
                </div>
            </div>

            <div class="service-card">
                <h3>🎯 Factif-AI</h3>
                <p>Computer control and browser automation service for web scraping and GUI interactions.</p>
                <div class="status online pulse">Service Online</div>
                <div class="links">
                    <a href="http://localhost:3001" target="_blank">Service API</a>
                    <a href="#" onclick="testFactifAI()">Test Automation</a>
                </div>
            </div>
        </div>

        <div class="unified-section">
            <h2>🔗 Unified Framework Features</h2>
            <div class="feature-list">
                <div class="feature-item">
                    <strong>Cross-Service Communication</strong><br>
                    Seamless integration between AIOS, ByteBot, and Factif-AI
                </div>
                <div class="feature-item">
                    <strong>Real-time Orchestration</strong><br>
                    Live coordination of AI agents and automation tasks
                </div>
                <div class="feature-item">
                    <strong>Unified API Gateway</strong><br>
                    Single entry point for all service interactions
                </div>
                <div class="feature-item">
                    <strong>Device Management</strong><br>
                    Centralized control of virtual and physical devices
                </div>
                <div class="feature-item">
                    <strong>Workflow Automation</strong><br>
                    Visual workflow builder for complex AI-driven tasks
                </div>
                <div class="feature-item">
                    <strong>Monitoring & Analytics</strong><br>
                    Comprehensive system health and performance tracking
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🎉 Unified AI Framework Successfully Activated!</p>
            <p>Integration Status: <span id="integration-status" class="pulse">Checking...</span></p>
        </div>
    </div>

    <script>
        // Check service status
        async function checkServices() {
            const services = [
                { name: 'AIOS', url: 'http://localhost:8000/health' },
                { name: 'Factif-AI', url: 'http://localhost:3001' }
            ];
            
            let activeServices = 0;
            
            for (const service of services) {
                try {
                    const response = await fetch(service.url, { mode: 'no-cors' });
                    activeServices++;
                } catch (error) {
                    console.log(`${service.name} check failed:`, error);
                }
            }
            
            const statusElement = document.getElementById('integration-status');
            if (activeServices >= 2) {
                statusElement.textContent = '✅ Services Integrated';
                statusElement.className = 'status online';
            } else if (activeServices >= 1) {
                statusElement.textContent = '⚠️ Partial Integration';
                statusElement.className = 'status mock';
            } else {
                statusElement.textContent = '❌ Services Offline';
                statusElement.className = 'status offline';
            }
        }

        // Test Factif-AI automation
        async function testFactifAI() {
            try {
                const response = await fetch('http://localhost:3001', { mode: 'no-cors' });
                alert('✅ Factif-AI is responding! Automation service is ready.');
            } catch (error) {
                alert('❌ Factif-AI is not responding. Please check the service.');
            }
        }

        // Check services on load
        checkServices();
        
        // Refresh status every 30 seconds
        setInterval(checkServices, 30000);
    </script>
</body>
</html>
    `);
});

// Unified dashboard route
app.get('/unified', (req, res) => {
    res.redirect('/');
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        services: {
            aios: 'mock',
            bytebot: 'offline', 
            factif_ai: 'online'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'unified-ui',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Unified Framework UI Server Started!
📍 URL: http://localhost:${PORT}
🎯 Dashboard: http://localhost:${PORT}/unified
⚡ Status: http://localhost:${PORT}/api/status
    `);
});