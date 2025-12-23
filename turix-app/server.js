const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = 9999;
server.listen(PORT, () => {
    console.log(`🚀 TuriX Unified AI Ecosystem running at http://localhost:${PORT}`);
    console.log('🎯 Features:');
    console.log('  • Unified interface for AI services');
    console.log('  • Voice command support');
    console.log('  • Service selection and status');
    console.log('  • Command execution and feedback');
    console.log('  • Modal AI traversal capabilities');
    console.log('');
    console.log('📱 Available Services:');
    console.log('  • 🤖 AIOS (Running on port 8010)');
    console.log('  • 🖥️ Bytebot (Desktop automation)');
    console.log('  • 📱 Postiz (Social media)');
    console.log('  • 🧪 Factif-AI (Testing automation)');
    console.log('');
    console.log('🎉 TuriX is ready for AI-powered automation!');
});