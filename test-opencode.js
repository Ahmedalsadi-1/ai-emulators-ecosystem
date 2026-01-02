// Test OpenCode.ai API integration
const OpenCodeProvider = require('./opencode-provider.js');

async function testOpenCodeAPI() {
    const apiKey = process.env.OPENCODE_API_KEY || '<set-opencode-api-key>';
    if (!apiKey || apiKey === '<set-opencode-api-key>') {
        throw new Error('Set OPENCODE_API_KEY in your environment before running this test');
    }

    const provider = new OpenCodeProvider(apiKey);

    console.log('Testing OpenCode.ai API...');

    try {
        // Test GPT-5-Nano (free)
        console.log('Testing GPT-5-Nano...');
        const gptNanoResponse = await provider.chat('Hello! Respond with just "GPT Nano OK"', { model: 'gpt-5-nano' });
        console.log('GPT-5-Nano Response:', gptNanoResponse);

        // Test Grok Code Fast (free)
        console.log('Testing Grok Code Fast...');
        const grokResponse = await provider.chat('Hello! Respond with just "Grok OK"', { model: 'grok-code' });
        console.log('Grok Code Fast Response:', grokResponse);

        // Test Big Pickle (free)
        console.log('Testing Big Pickle...');
        const bigPickleResponse = await provider.chat('Hello! Respond with just "Big Pickle OK"', { model: 'big-pickle' });
        console.log('Big Pickle Response:', bigPickleResponse);

        console.log('All OpenCode.ai models tested successfully!');

    } catch (error) {
        console.error('OpenCode.ai API test failed:', error);
    }
}

// Run the test
testOpenCodeAPI();
