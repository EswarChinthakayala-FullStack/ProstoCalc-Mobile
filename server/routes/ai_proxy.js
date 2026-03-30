const express = require('express');
const router = express.Router();
const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen:3.4b';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

/**
 * Local AI Proxy Route: Ollama with Mistral Fallback
 * This centralizes AI logic within the main server process.
 */
router.post('/chat', async (req, res) => {
    const { messages, model, stream = false, response_format } = req.body;
    const targetModel = model || OLLAMA_MODEL;

    console.log(`\n\x1b[35m[AI Request Trace] --------------------------------------------\x1b[0m`);
    console.log(`\x1b[36mModel: ${targetModel}\x1b[0m`);
    console.log(`\x1b[36mPrompt: "${messages[messages.length - 1]?.content.substring(0, 100)}..." (${messages.length} messages)\x1b[0m`);

    try {
        console.log(`\x1b[34m[AI-Proxy] Step 1: Trying Local OLLAMA (${OLLAMA_MODEL})\x1b[0m`);
        
        // Try Ollama first
        const ollamaResponse = await axios.post(`${OLLAMA_URL}/api/chat`, {
            model: OLLAMA_MODEL,
            messages: messages,
            stream: stream,
            options: { temperature: 0.2 },
            format: response_format && response_format.type === 'json_object' ? 'json' : undefined
        }, { timeout: 45000 });

        const responseContent = ollamaResponse.data.message?.content || "";
        console.log(`\x1b[32m[AI-Proxy] SUCCESS: Ollama responded [${responseContent.length} chars]\x1b[0m`);
        console.log(`\x1b[35m-------------------------------------------------------------\x1b[0m\n`);
        return res.json(ollamaResponse.data);

    } catch (ollamaError) {
        console.error(`\x1b[31m[AI-Proxy] OLLAMA FAILED: ${ollamaError.message}\x1b[0m`);
        
        if (MISTRAL_API_KEY && MISTRAL_API_KEY.length > 10) {
            console.log(`\x1b[33m[AI-Proxy] Step 2: Falling back to MISTRAL (mistral-small-latest)\x1b[0m`);
            try {
                const mistralResponse = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                    model: "mistral-small-latest",
                    messages: messages,
                    response_format: response_format || { type: "text" }
                }, {
                    headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}` }
                });

                const content = mistralResponse.data.choices[0].message.content;
                console.log(`\x1b[32m[AI-Proxy] FALLBACK SUCCESS: Mistral responded [${content.length} chars]\x1b[0m`);
                console.log(`\x1b[35m-------------------------------------------------------------\x1b[0m\n`);
                
                // Map Mistral response to Ollama-like format for client compatibility
                return res.json({
                    model: "mistral-fallback",
                    message: {
                        role: "assistant",
                        content: content
                    },
                    done: true
                });

            } catch (mistralError) {
                console.error(`\x1b[41m[AI-Proxy] CRITICAL: Both Ollama and Mistral failed.\x1b[0m`);
                console.error(mistralError.response?.data || mistralError.message);
                console.log(`\x1b[35m-------------------------------------------------------------\x1b[0m\n`);
                
                return res.status(500).json({ 
                    status: 'error',
                    error: "Both Ollama and Mistral failed.",
                    ollama_message: ollamaError.message,
                    mistral_message: mistralError.message 
                });
            }
        } else {
            console.warn(`\x1b[31m[AI-Proxy] OLLAMA failed and no valid MISTRAL_API_KEY configured for fallback.\x1b[0m`);
            console.log(`\x1b[35m-------------------------------------------------------------\x1b[0m\n`);
            return res.status(503).json({ 
                status: 'error',
                error: "Primary provider (Ollama) failed and no fallback available.",
                details: ollamaError.message
            });
        }
    }
});

/**
 * Integrated Health Check
 */
router.get('/health-check', async (req, res) => {
    let ollamaStatus = 'unknown';
    try {
        const ollamaRes = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 2000 });
        ollamaStatus = ollamaRes.status === 200 ? 'online' : 'unhealthy';
    } catch (e) {
        ollamaStatus = 'offline';
    }

    res.json({ 
        status: 'ok', 
        ollama: {
            url: OLLAMA_URL,
            model: OLLAMA_MODEL,
            status: ollamaStatus
        },
        mistral: {
            status: MISTRAL_API_KEY ? 'configured' : 'missing_key'
        }
    });
});

module.exports = router;
