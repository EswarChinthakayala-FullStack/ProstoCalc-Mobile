const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../../utils/ai');

// --- WEB-ONLY: Puter AI Explanation ---
// This endpoint is specifically used by the website for clinical cost explanations.
router.post('/explain_cost', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ status: 'error', message: 'Prompt is required' });
        }

        console.log(`[Web API] Puter AI Explanation requested via /puter/explain_cost`);
        const result = await chatWithAI(prompt);
        
        res.json({ 
            status: 'success', 
            result,
            explanation: result // Adding both for compatibility
        });
    } catch (error) {
        console.error("[Web API] Puter AI Error:", error.message);
        
        // Final fallback: Use a generic dental justification
        const justifications = [
            "The proposed dental procedure is clinically indicated based on the diagnostic assessment. Our standard protocol ensures optimal material selection and long-term success.",
            "Based on the treatment complexity, a multi-phased approach is recommended to ensure tissue adaptation and structural integrity.",
            "The estimated cost includes high-grade clinical materials, local anesthesia, and comprehensive post-operative follow-up support."
        ];
        const fallbackExp = justifications[Math.floor(Math.random() * justifications.length)];

        res.json({
            status: 'success',
            result: fallbackExp,
            explanation: fallbackExp,
            note: "Using system fallback due to AI provider failure."
        });
    }
});

module.exports = router;
