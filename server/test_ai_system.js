const { chatWithAI } = require('./utils/ai');
require('dotenv').config();

/**
 * AI System Verification Script: Testing Hierarchical AI Providers
 * Tests:
 * 1. AI Proxy (Ollama/Mistral)
 * 2. Standalone Deployment Model (Quantized + RAG)
 * 3. Cloud Fallbacks (Puter/Vercel)
 */
async function runAITest() {
    console.log(`\n\x1b[36m--- Prosto AI System Verification ---\x1b[0m`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`Configured Model: ${process.env.OLLAMA_MODEL || 'qwen2:0.5b'}`);
    console.log(`Proxy Destination: ${process.env.AI_SERVER_URL || 'http://localhost:3000/api/chat'}`);
    console.log(`\x1b[36m--------------------------------------\x1b[0m\n`);

    // TEST 1: Common clinical inquiry (should trigger RAG context)
    const testPrompt = "What is the cost for a dental crown and what is the clinical advice?";
    
    console.log(`\x1b[33m[Test Case] Sending Inquiry: "${testPrompt}"...\x1b[0m`);
    
    try {
        const start = Date.now();
        const response = await chatWithAI(testPrompt);
        const duration = (Date.now() - start) / 1000;

        console.log(`\n\x1b[32m[VERIFIED RESPONSE in ${duration.toFixed(2)}s]:\x1b[0m`);
        console.log(`\x1b[35m"${response}"\x1b[0m\n`);

        if (response.toLowerCase().includes('₹')) {
            console.log(`\x1b[32m✓ Currency Format: Correct (₹ detected)\x1b[0m`);
        } else {
            console.log(`\x1b[33m⚠ Currency Format: No ₹ symbol found (might be a generic response)\x1b[0m`);
        }

        if (response.length > 10) {
            console.log(`\x1b[32m✓ Engine Response: Success\x1b[0m`);
        }

    } catch (error) {
        console.error(`\n\x1b[41m[SYSTEM FAILURE] All AI providers failed:\x1b[0m`);
        console.error(error.message);
    }

    console.log(`\n\x1b[36m--- Verification Complete ---\x1b[0m\n`);
    process.exit(0);
}

runAITest();
