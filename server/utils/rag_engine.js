const db = require('../db');

/**
 * RAG Engine: Retrieving clinical data to augment prompts
 * Keeps the model informed about specific treatments and clinical standards.
 */
async function getClinicalKnowledge(query = "") {
    try {
        console.log(`\x1b[34m[RAG-Engine] Fetching clinical context for: "${query}"\x1b[0m`);
        
        // 1. Get treatment catalog information
        const [treatments] = await db.query('SELECT name, category, default_cost, description FROM treatment_catalog LIMIT 100');
        
        // 2. Powerful keyword search (finds 'Crown' in 'Dental Crown')
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const relevantDocs = treatments.filter(t => {
            const name = t.name.toLowerCase();
            const category = t.category.toLowerCase();
            return queryTerms.some(term => name.includes(term) || category.includes(term));
        });

        // 3. Format context
        if (relevantDocs.length === 0) {
            // Default clinical context if no specific match
            return `General Dental Standards: Procedures involve sterile preparation, local anesthesia, and specific post-operative care. Current clinics are located in major cities. Treatments include hygiene, restorations, and prosthodontics.`;
        }

        const context = relevantDocs.map(d => 
            `\n- ${d.name} (${d.category}): Base Cost ₹${d.default_cost}. Details: ${d.description || "Standard dental care."}`
        ).join("");

        return `CLINICAL KNOWLEDGE BASE:\n${context}`;
        
    } catch (err) {
        console.warn("[RAG-Engine] Failed to fetch clinical context:", err.message);
        return "";
    }
}

/**
 * Get Project & Navigation Knowledge
 */
function getProjectKnowledge(query = "", role = "Guest") {
    const isDoctor = role.toLowerCase() === 'dentist';
    
    // Simplification for the 0.5B model (it's better with text rules than JSON)
    const projectDesc = "ProstoCalc is an AI for dental clinics with Predictive costing and CMS.";
    
    let navTips = `NAVIGATION RULES (ONLY USE THESE EXACT CODES AT THE END):\n`;
    if (isDoctor) {
        navTips += `- If they want to see "REQUESTS" or "PATIENTS": Use [NAV: /dashboard/clinician/requests]\n`;
        navTips += `- If they want to see "PROFILE" or "MY ACCOUNT": Use [NAV: /dentist/profile]\n`;
        navTips += `- If they want "ESTIMATOR": Use [NAV: /dashboard/clinician/estimator]\n`;
        navTips += `- If they want "ANALYTICS": Use [NAV: /dashboard/clinician/analytics]\n`;
        navTips += `- If they want "HOME" or "FRONT": Use [NAV: /dashboard/clinician]\n`;
    } else {
        navTips += `- If they want "RADAR": Use [NAV: /patient/radar]\n`;
        navTips += `- If they want "EXERCISES": Use [NAV: /patient/mouth-opening]\n`;
        navTips += `- If they want "CHAT": Use [NAV: /patient/ai-chat]\n`;
        navTips += `- If they want "TRACKERS": Use [NAV: /patient/trackers]\n`;
        navTips += `- If they want "PROFILE": Use [NAV: /patient/profile]\n`;
    }

    return `IDENTITY: ${projectDesc}\nUSER ROLE: ${role}\n${navTips}`;
}

/**
 * Augment a list of messages with clinical and project context
 */
async function augmentMessages(messages, role = 'Guest') {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMsg) return messages;

    const query = lastUserMsg.content;
    const clinicalContext = await getClinicalKnowledge(query);
    const projectContext = getProjectKnowledge(query, role);
    
    const augmentedMessages = [...messages];
    const systemIdx = augmentedMessages.findIndex(m => m.role === 'system');
    
    const strictInstruction = `
[SYSTEM IDENTITY]
You are the Prosto AI Concierge. You are professional, polite, and technically proficient.
Your goal is to assist Clinicians (Dentists) and Patients in navigating the ProstoCalc platform.

[INTERACTION RULES]
1. PERSONALITY: Be helpful and encouraging. Use "Doctor" if the role is dentist.
2. FORMATTING: Use Markdown (bold, lists, etc.) to make responses readable.
3. CURRENCY: ONLY use ₹ (Indian Rupee). NEVER use Dollars.
4. NAVIGATION: If the user says "Navigate", "Go to", "Find", "Show me", or "Take me to":
   - Search the NAVIGATION SHORTCUTS list provided below.
   - If a match is found, append EXACTLY [NAV: /path] to the very end of your response.
   - Respond with: "Certainly! I'm redirecting you to [Page Name] now. [NAV: /path]" or similar polite phrasing.

[KNOWLEDGE DATA]
${clinicalContext}
${projectContext}
`;
    
    if (systemIdx >= 0) {
        augmentedMessages[systemIdx].content = strictInstruction + "\n" + augmentedMessages[systemIdx].content;
    } else {
        augmentedMessages.unshift({ role: 'system', content: strictInstruction });
    }

    return augmentedMessages;
}

module.exports = { getClinicalKnowledge, augmentMessages };
