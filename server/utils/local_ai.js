const { pipeline } = require('@huggingface/transformers');
const path = require('path');

let chatbotPipeline = null;

/**
 * Initialize the Quantized Local Model
 */
async function initModel() {
    if (chatbotPipeline) return chatbotPipeline;
    
    console.log("\x1b[34m[Local-AI] Loading Quantized Model: Xenova/Qwen1.5-0.5B-Chat...\x1b[0m");
    try {
        chatbotPipeline = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
            device: 'cpu',
            cache_dir: path.join(__dirname, '../models')
        });
        console.log("\x1b[32m[Local-AI] Model Loaded Successfully. (CPU/Q4)\x1b[0m");
        return chatbotPipeline;
    } catch (err) {
        console.error("\x1b[31m[Local-AI] Failed to load model:\x1b[0m", err.message);
        throw err;
    }
}

/**
 * Generate inference using the local engine
 */
async function generateLocalResponse(messages) {
    const generator = await initModel();
    
    // 1. Format the conversation for the chat model
    // Qwen uses specific prompt templates. We'll simplify for the smaller model.
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || "";
    const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
    
    const prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${lastUserMsg}<|im_end|>\n<|im_start|>assistant\n`;

    console.log("\x1b[34m[Local-AI] Generating inference locally...\x1b[0m");
    
    const output = await generator(prompt, {
        max_new_tokens: 256,
        temperature: 0.2,
        do_sample: false,
        return_full_text: false,
    });

    const response = output[0].generated_text.trim();
    console.log("\x1b[32m[Local-AI] Generation complete.\x1b[0m");
    
    return response;
}

module.exports = { generateLocalResponse };
