const { generateLocalResponse } = require('./utils/local_ai');
const { augmentMessages } = require('./utils/rag_engine');
require('dotenv').config();

/**
 * Dedicated test for the Standalone Quantized Model (Transformers.js)
 * This script bypasses Ollama/Mistral to verify the integrated local engine.
 */
async function testStandaloneEngine() {
    console.log(`\n\x1b[36m--- Standalone Local engine Verification ---\x1b[0m`);
    console.log(`Model: Xenova/Qwen2.5-0.5B-Instruct (Quantized)`);
    console.log(`Note: The first run will download the model files (~350MB).\x1b[0m\n`);

    const prompt = "How much for a dental crown?";
    
    try {
        console.log(`\x1b[33m[Test Case] Query: "${prompt}"\x1b[0m`);
        
        // 1. Prepare messages with RAG context
        const rawMessages = [
            { role: 'system', content: "You are Prosto AI, a professional dental assistant. Use the provided database context to answer accurately." },
            { role: 'user', content: prompt }
        ];
        
        console.log(`\x1b[34m[RAG] Augmenting messages...\x1b[0m`);
        const augmented = await augmentMessages(rawMessages);

        // 2. Generate using local quantized engine
        const start = Date.now();
        const response = await generateLocalResponse(augmented);
        const duration = (Date.now() - start) / 1000;

        console.log(`\n\x1b[32m[LOCAL ENGINE RESPONSE in ${duration.toFixed(2)}s]:\x1b[0m`);
        console.log(`\x1b[35m"${response}"\x1b[0m\n`);

        if (response.toLowerCase().includes('₹1300')) {
            console.log(`\x1b[32m✓ RAG Verification: Success (Correct database price found)\x1b[0m`);
        } else {
            console.log(`\x1b[33m⚠ RAG Verification: Price not detected in response.\x1b[0m`);
        }

    } catch (error) {
        console.error(`\n\x1b[41m[LOCAL ENGINE FAILURE]\x1b[0m`);
        console.error(error.message);
    }

    console.log(`\n\x1b[36m--- Verification Complete ---\x1b[0m\n`);
    process.exit(0);
}

testStandaloneEngine();
