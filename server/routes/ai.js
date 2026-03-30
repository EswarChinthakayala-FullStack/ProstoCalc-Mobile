const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../utils/ai');

router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const result = await chatWithAI(prompt);
        res.json({ result });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "Failed to generate AI response", details: error.message });
    }
});

// Chat assistant endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const response = await chatWithAI(message);
        res.json({ success: true, response });
    } catch (error) {
        console.error("AI Chat Error:", error);

        const fallbackResponse = "I'm currently having trouble connecting to my AI brain. Please try again in a few moments, or contact support if the issue persists.";
        res.json({
            success: true,
            response: fallbackResponse,
            note: "System fallback enabled"
        });
    }
});

module.exports = router;
