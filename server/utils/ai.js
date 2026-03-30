const { init } = require('@heyputer/puter.js/src/init.cjs');
const axios = require('axios');
require('dotenv').config();

let puter = null;

function getPuter() {
    if (!puter) {
        const token = process.env.PUTER_AUTH_TOKEN;
        if (!token) {
            console.warn("\x1b[33m[AI Config] PUTER_AUTH_TOKEN not found in .env. Puter AI is DISABLED.\x1b[0m");
            return null;
        }
        try {
            puter = init(token);
            console.log("\x1b[32m[AI Config] Puter AI initialization SUCCESS. Provider: Puter.js\x1b[0m");
        } catch (error) {
            console.error("\x1b[31m[AI Config] Failed to initialize Puter.js:\x1b[0m", error.message);
        }
    }
    return puter;
}

// Log initial AI status
console.log("\n\x1b[36m--- AI Provider Status ---\x1b[0m");
console.log(`Puter AI: ${process.env.PUTER_AUTH_TOKEN ? 'READY' : 'MISSING TOKEN'}`);
console.log(`Default Model: gpt-4o`);
console.log(`Fallback: Vercel Cloud API (https://prosto-calc.vercel.app)`);
console.log("\x1b[36m--------------------------\x1b[0m\n");

const { generateLocalResponse } = require('./local_ai');
const { augmentMessages } = require('./rag_engine');

/**
 * Common helper to chat with AI with fallback
 */
async function chatWithAI(prompt, role = 'Guest') {
    const rawMessages = [
        { role: 'system', content: `You are Prosto AI, a professional medical and dental assistant. User Role: ${role}. Provide clinical advice that is concise and evidence-based. Choose the single most relevant response. Always use ₹ for currency.` },
        { role: 'user', content: prompt }
    ];
    const augmentedMessages = await augmentMessages(rawMessages, role);

    // 1. PRIMARY: AI Proxy (Ollama/Mistral)
    try {
        const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:3000/api/chat';
        console.log(`\x1b[34m[AI Request] Provider: AI Proxy | Destination: ${aiServerUrl}\x1b[0m`);
        
        const localRes = await axios.post(aiServerUrl, {
            messages: augmentedMessages
        }, { timeout: 30000 });

        if (localRes.data && localRes.data.message) {
            console.log("\x1b[32m[AI] AI Proxy Success.\x1b[0m");
            return localRes.data.message.content;
        }
    } catch (localErr) {
        console.warn("\x1b[33m[AI] AI Proxy failed (Ollama/Localhost). Trying Local Quantized Engine...\x1b[0m");
    }

    // 2. STANDALONE LOCAL: Quantized Engine (Transformer.js / ONNX)
    try {
        const localResult = await generateLocalResponse(augmentedMessages);
        if (localResult) {
            console.log("\x1b[32m[AI] Standalone Local Quantized Model Success.\x1b[0m");
            return localResult;
        }
    } catch (qErr) {
        console.warn("\x1b[33m[AI] Local Quantized Model failed. Trying Mistral Cloud...\x1b[0m");
    }

    // 3. DEPLOYMENT-READY: Dedicated Mistral Cloud Primary
    if (process.env.MISTRAL_API_KEY) {
        try {
            console.log(`\x1b[34m[AI Request] Provider: Mistral Cloud | Model: mistral-tiny\x1b[0m`);
            const mistralRes = await axios.post("https://api.mistral.ai/v1/chat/completions", {
                model: "mistral-tiny",
                messages: augmentedMessages,
                temperature: 0.2
            }, {
                headers: { "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}` },
                timeout: 10000
            });

            if (mistralRes.data?.choices?.[0]?.message?.content) {
                console.log("\x1b[32m[AI] Mistral Cloud Success.\x1b[0m");
                return mistralRes.data.choices[0].message.content;
            }
        } catch (mistralErr) {
            console.error("\x1b[31m[AI] Mistral Cloud failed:\x1b[0m", mistralErr.message);
        }
    }

    // 2. Try Puter AI next
    const p = getPuter();
    if (p) {
        try {
            console.log(`\x1b[34m[AI Request] Provider: Puter | Model: gpt-4o\x1b[0m`);
            const response = await p.ai.chat(prompt, { model: 'gpt-4o' });
            let content = null;

            if (typeof response === 'string') content = response;
            else if (response.message && response.message.content) content = response.message.content;

            if (content) {
                console.log("[AI] Puter AI Response Successful.");
                return content;
            }
        } catch (error) {
            console.error("[AI] Puter AI Error, falling back to Vercel:", error.message);
        }
    }

    // 2. Fallback to Vercel Cloud API
    try {
        console.log("[AI] Attempting Vercel Cloud API Fallback...");
        const vercelRes = await axios.post("https://prosto-calc.vercel.app/api/explain-cost", {
            userPrompt: prompt
        }, { timeout: 10000 });

        if (vercelRes.data && vercelRes.data.result) {
            console.log("[AI] Vercel Cloud API Success.");
            return vercelRes.data.result;
        } else if (vercelRes.data && vercelRes.data.explanation) {
            // Handle alternate response field if applicable
            return vercelRes.data.explanation;
        }
    } catch (vercelErr) {
        console.error("[AI] Vercel Fallback Failed:", vercelErr.message);
    }

    throw new Error("All AI providers failed. Please check credentials and network connectivity.");
}

module.exports = { getPuter, chatWithAI };
