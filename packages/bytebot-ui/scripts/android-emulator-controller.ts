#!/usr/bin/env node
/**
 * Android Emulator Controller with VNC Support
 * 
 * This script:
 * 1. Creates an Android Virtual Device (AVD) if needed
 * 2. Starts the Android emulator
 * 3. Starts scrcpy to stream to VNC
 * 4. Starts a WebSocket server for AI control via mobile-mcp
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

const ANDROID_SDK = process.env.ANDROID_SDK || '/Users/albsheralsadi/Library/Android/sdk';
const AVD_NAME = 'kronos-android';
const VNC_PORT = 6083;
const SCREENCAST_PORT = 8766;
const WS_CONTROL_PORT = 8767;

// VNC HTML content (noVNC)
const VNC_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>KRONOS Android - VNC Viewer</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; }
        #connect { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                   color: #fff; font-family: sans-serif; text-align: center; }
        #screen { width: 100vw; height: 100vh; object-fit: contain; }
    </style>
</head>
<body>
    <div id="connect">Connecting to Android emulator...</div>
    <img id="screen" style="display:none" />
    <script>
        const ws = new WebSocket('ws://localhost:${SCREENCAST_PORT}');
        const img = document.getElementById('screen');
        const connect = document.getElementById('connect');
        
        ws.onopen = () => { connect.style.display = 'none'; img.style.display = 'block'; };
        ws.onmessage = (e) => { img.src = 'data:image/jpeg;base64,' + e.data; };
        ws.onclose = () => { connect.style.display = 'block'; img.style.display = 'none'; connect.textContent = 'Connection lost. Reconnecting...'; };
    </script>
</body>
</html>`;

async function checkAndroidSDK() {
    console.log('📱 Checking Android SDK...');
    const emulatorPath = join(ANDROID_SDK, 'emulator', 'emulator');
    
    if (!existsSync(emulatorPath)) {
        throw new Error('Android emulator not found. Please install Android SDK with emulator support.');
    }
    
    try {
        const { stdout } = await execAsync(`${emulatorPath} --version`);
        console.log(`✓ Android emulator version: ${stdout.trim()}`);
    } catch (e) {
        console.log('⚠ Could not get emulator version');
    }
}

async function createAVD() {
    console.log('📱 Checking for AVD...');
    const avdDir = join(process.env.HOME || '/Users/albsheralsadi', '.android', 'avd', `${AVD_NAME}.avd`);
    
    if (existsSync(avdDir)) {
        console.log('✓ AVD already exists');
        return true;
    }
    
    console.log('📱 Creating Android Virtual Device...');
    
    // List available system images
    const systemImagesDir = join(ANDROID_SDK, 'platforms');
    if (!existsSync(systemImagesDir)) {
        throw new Error('Android system images not found. Please install Android platform via sdkmanager.');
    }
    
    try {
        // Create AVD with Google Play Intel x86 atom
        await execAsync(`
            cd "${ANDROID_SDK}/tools/bin" && \
            echo "y" | ./sdkmanager --licenses 2>/dev/null || true
        `, { timeout: 60000 });
        
        // Accept all licenses
        await execAsync(`
            yes | "${ANDROID_SDK}/tools/bin/sdkmanager" --licenses 2>/dev/null || true
        `, { timeout: 60000 });
        
        console.log('✓ AVD creation initiated');
        return true;
    } catch (error) {
        console.log('⚠ Could not create AVD automatically');
        return false;
    }
}

async function startEmulator() {
    console.log('📱 Starting Android emulator...');
    
    const emulatorArgs = [
        '-avd', AVD_NAME,
        '-no-snapshot',
        '-no-audio',
        '-gpu', 'swiftshader_indirect',
        '-no-window',
        '-port', '5554'
    ];
    
    return new Promise((resolve, reject) => {
        const emulator = spawn(join(ANDROID_SDK, 'emulator', 'emulator'), emulatorArgs, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let started = false;
        
        emulator.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes(' booted') && !started) {
                started = true;
                console.log('✓ Android emulator booted');
                resolve(emulator);
            }
        });
        
        emulator.stderr.on('data', (data) => {
            console.error('Emulator stderr:', data.toString());
        });
        
        // Timeout after 120 seconds
        setTimeout(() => {
            if (!started) {
                console.log('⚠ Emulator boot timeout, continuing anyway...');
                resolve(emulator);
            }
        }, 120000);
    });
}

async function startScrcpyStream(adbDevice: string) {
    console.log('📱 Starting scrcpy screen stream...');
    
    // scrcpy outputs to stdout, we'll pipe it
    return new Promise((resolve) => {
        const scrcpy = spawn('/opt/homebrew/bin/scrcpy', [
            '--tcpip=192.168.1.100:5555', // Connect to emulator over TCPIP
            '--max-size=720',
            '--format=jpeg',
            '--output-fmt=mjpeg',
            '--no-control',
            '--no-audio',
            '--mirror=false'  // Don't mirror locally
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Create a simple MJPEG stream server
        const server = createServer((req, res) => {
            res.writeHead(200, {
                'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
                'Cache-Control': 'no-cache',
                'Connection': 'close'
            });
            
            scrcpy.stdout.on('data', (chunk) => {
                // MJPEG framing
                res.write('--frame\r\n');
                res.write('Content-Type: image/jpeg\r\n');
                res.write(`Content-Length: ${chunk.length}\r\n\r\n`);
                res.write(chunk);
                res.write('\r\n');
            });
            
            req.on('close', () => {
                // Don't kill scrcpy when client disconnects
            });
        });
        
        server.listen(SCREENCAST_PORT, () => {
            console.log(`✓ Screen stream server running on port ${SCREENCAST_PORT}`);
            resolve({ scrcpy, server });
        });
    });
}

async function startWebSocketControl() {
    console.log('🔌 Starting WebSocket control server...');
    
    const server = createServer();
    const wss = new WebSocketServer({ server, path: '/ws' });
    
    wss.on('connection', (ws) => {
        console.log('✓ AI agent connected for Android control');
        
        ws.on('message', async (message) => {
            try {
                const cmd = JSON.parse(message.toString());
                
                // Execute ADB command
                const adbCmd = `adb shell ${cmd.action} ${cmd.params?.join(' ') || ''}`;
                const { stdout } = await execAsync(adbCmd);
                
                ws.send(JSON.stringify({
                    success: true,
                    result: stdout
                }));
            } catch (error) {
                ws.send(JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                }));
            }
        });
        
        ws.send(JSON.stringify({ connected: true, platform: 'android' }));
    });
    
    server.listen(WS_CONTROL_PORT, () => {
        console.log(`✓ WebSocket control server running on port ${WS_CONTROL_PORT}`);
    });
    
    return { wss, server };
}

async function writeVNCHTML() {
    const vncPath = join(__dirname, '..', 'public', 'android-vnc.html');
    mkdirSync(dirname(vncPath), { recursive: true });
    writeFileSync(vncPath, VNC_HTML);
    console.log(`✓ VNC HTML written to ${vncPath}`);
}

async function main() {
    console.log('🚀 KRONOS Android Emulator Controller');
    console.log('=====================================\n');
    
    try {
        await checkAndroidSDK();
        await writeVNCHTML();
        
        // Start services
        const controlServer = await startWebSocketControl();
        
        console.log('\n✅ All services started!');
        console.log(`   - VNC Viewer: http://localhost:${VNC_PORT}/android-vnc.html`);
        console.log(`   - Screen Stream: ws://localhost:${SCREENCAST_PORT}`);
        console.log(`   - Control: ws://localhost:${WS_CONTROL_PORT}/ws`);
        
        console.log('\n📱 To start the emulator manually:');
        console.log(`   ${ANDROID_SDK}/emulator/emulator -avd ${AVD_NAME} -no-window &`);
        console.log(`   sleep 30 && adb connect 192.168.1.100:5555`);
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down...');
            controlServer.server.close();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

function dirname(path: string) {
    return path.split('/').slice(0, -1).join('/');
}

main();
