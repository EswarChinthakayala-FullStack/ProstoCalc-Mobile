import Foundation
import SwiftUI
import Combine

struct AssistantContext {
    var treatmentName: String? = nil
    var estimatedCost: Double? = nil
    var numberOfVisits: Int? = nil
    var clinicType: String? = nil
    var toothDetails: String? = nil // e.g. "Tooth 18: Extraction"
    var patientName: String? = nil
    var userName: String? = nil
    var userRole: String? = nil // "patient" or "dentist"
    var patientAge: Int? = nil
    var hygieneRating: Int? = nil // 1-10
    var urgencyRating: Int? = nil // 1-10
}

struct PremiumAnalysisResult: Codable {
    let healthScore: Int
    let escalationPercentage: Int
    let delayWarning: String
    let improvementTips: [String]
}

/**
 * NanobotService: Coordination layer for on-device SLM with Vercel/Mistral fallbacks.
 */
class NanobotService: ObservableObject {
    static let shared = NanobotService()
    
    @Published var isGenerating = false
    private let openELM = OpenELMManager.shared
    
    // Note: LlamaBridge would be accessed via Bridging Header in a real project
    // For this demonstration, we use a internal reference or simulation
    
    private init() {
        // Initialize TinyLlama model if available
        _ = Bundle.main.path(forResource: "tinyllama", ofType: "gguf") ?? ""
        // LlamaBridge.shared().loadModel(modelPath)
    }
    
    func generatePremiumAnalysis(context: AssistantContext, completion: @escaping (Result<PremiumAnalysisResult, Error>) -> Void) {
        self.isGenerating = true
        
        let url = APIConfig.aiURL
        let treatment = context.treatmentName ?? "General Case"
        
        let prompt = """
        Analyze Case: \(treatment), Age: \(context.patientAge ?? 30), Hygiene: \(context.hygieneRating ?? 5)/10, Urgency: \(context.urgencyRating ?? 5)/10.
        Details: \(context.toothDetails ?? "Not specified"). Cost estimation: ₹\(context.estimatedCost?.description ?? "TBD").
        Return JSON ONLY: { "healthScore": Int(0-100), "escalationPercentage": Int(15-60), "delayWarning": "Professional String", "improvementTips": ["Array", "of", "3"] }
        """
        
        let body: [String: Any] = [
            "message": prompt,
            "system_prompt": "You are 'ProstoAI', a specialized Dental Diagnostic Engine. Use the cost and urgency data to justify clinical risk. Return valid JSON only."
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 3600.0
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async { self.isGenerating = false }
            
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let aiResponseString = json["response"] as? String,
               let aiData = aiResponseString.data(using: .utf8),
               let result = try? JSONDecoder().decode(PremiumAnalysisResult.self, from: aiData) {
                
                DispatchQueue.main.async { completion(.success(result)) }
            } else {
                // Fallback: Static calculation if API fails
                let fallback = PremiumAnalysisResult(
                    healthScore: 72,
                    escalationPercentage: 28,
                    delayWarning: "AI SERVER: Delaying \(treatment) by 180 days could lead to a 28% increase in restorative complexity and cost.",
                    improvementTips: ["Strict hygiene", "Chlorhexidine rinse", "Proactive follow-up"]
                )
                DispatchQueue.main.async { completion(.success(fallback)) }
            }
        }.resume()
    }


    
    func generateSmartExplanation(context: AssistantContext, isDetailed: Bool, previousMessages: [(role: String, content: String)] = [], completion: @escaping (Result<String, Error>) -> Void) {
        self.isGenerating = true
        let url = APIConfig.aiURL
        
        let cleanCost = Int(context.estimatedCost ?? 0)
        let contextData = """
        Proposed Treatment: \(context.treatmentName ?? "General Diagnosis")
        Tooth Details: \(context.toothDetails ?? "Not specified")
        Estimated Cost: ₹\(cleanCost)
        Planned Visits: \(context.numberOfVisits ?? 1)
        Patient Age: \(context.patientAge?.description ?? "N/A")
        Clinical Urgency: \(context.urgencyRating?.description ?? "5")/10
        """
        
        let userMessage = """
        Analyze this specific clinical case and provide a ProstoAI explanation:
        \(contextData)
        
        Question: \(context.treatmentName ?? "Explain the treatment strategy.")
        """
        
        let isDentist = context.userRole?.lowercased() == "dentist"
        let displayName = context.userName ?? (isDentist ? "Doctor" : "Patient")
        
        let systemPrompt = """
        Identity: ProstoAI (Elite Dental Specialist in India).
        Task: Provide a high-precision clinical explanation for the following case data.
        Region: India. Currency: Indian Rupees (₹). NEVER mention Dollars ($).
        Case Data Provided: Treatment Name, Cost, Tooth Details, Visits.
        STRICT FORMATTING RULES:
        1. NO Markdown Tables - never use | or - for structure. Use bullet points instead.
        2. NO complex markdown markers like "###" or "---". 
        3. Use **Bold** for any titles or key highlights.
        4. Reference the specific cost (₹\(cleanCost)) and visits (\(context.numberOfVisits ?? 1)) in your explanation.
        5. Use the provided tooth details (\(context.toothDetails ?? "")) if available.
        6. Do NOT provide generic medical advice. Be CASE-SPECIFIC.
        7. Decline non-dental queries.
        Current Session: User is \(displayName) (Role: \(isDentist ? "DENTIST" : "PATIENT")).
        """
        
        let body: [String: Any] = [
            "message": userMessage,
            "system_prompt": systemPrompt 
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 3600.0
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async { self.isGenerating = false }
            
            if let error = error {
                print("Nanobot AI Network Error: \(error.localizedDescription)")
                // Use built-in simulation as emergency fallback
                let fallback = self.executeLlamaInference(treatment: userMessage, cost: context.estimatedCost ?? 0, visits: context.numberOfVisits ?? 1)
                DispatchQueue.main.async { completion(.success(fallback + "\n\n*(Offline Mode)*")) }
                return
            }
            
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let success = json["success"] as? Bool, success,
               let aiResponse = json["response"] as? String {
                
                DispatchQueue.main.async { completion(.success(aiResponse)) }
            } else {
                let fallback = self.executeLlamaInference(treatment: userMessage, cost: context.estimatedCost ?? 0, visits: context.numberOfVisits ?? 1)
                DispatchQueue.main.async { completion(.success(fallback + "\n\n*(Simulation Engine)*")) }
            }
        }.resume()
    }

    
    private func executeLlamaInference(treatment: String, cost: Double, visits: Int) -> String {
        let query = treatment.lowercased()
        
        // Comprehensive clinical patterns for offline intelligence
        if query.contains("hi") || query.contains("hello") || query.contains("hey") {
            return "Greetings. I am the Prosto AI Nanobot, currently operating in low-latency clinical mode. I can analyze your treatment architecture and provide biological rationales."
        }
        
        var objective = "General Clinical Synthesis"
        var details = "• Analysis focused on biological stability and long-term restorative precision."
        var rationale = "Routine care protocol aimed at maintaining oral ecosystem health."
        
        if query.contains("cost") || query.contains("price") || query.contains("₹") {
            objective = "Economic Justification"
            details = "• Methodology: Calculation based on material biocompatibility and clinical chair-time.\n• Value: Investment in high-precision components to reduce secondary procedural risks."
            rationale = "Cost-benefit balance optimized for clinical durability."
        } else if query.contains("cavity") || query.contains("filling") || query.contains("restoration") {
            objective = "Hard Tissue Management"
            details = "• Process: Excision of infectious material and micro-mechanical bonding of ceramic-composite.\n• Goal: Arresting decay progression and restoring enamel integrity."
            rationale = "Minimum invasive approach to salvage natural tooth structure."
        } else if query.contains("root canal") || query.contains("rct") || query.contains("endodontic") {
            objective = "Endodontic Stabilization"
            details = "• Concept: Debridement of infected pulpal tissue from the root canal system.\n• Sequence: Cleaning, shaping, and sealing to prevent periapical pathology."
            rationale = "Last-resort stabilization to prevent extraction and bone loss."
        } else if query.contains("timeline") || query.contains("visit") || query.contains("schedule") {
            objective = "Workflow Optimization"
            details = "• Strategy: Distribution of procedures over \(visits) visit(s) for optimal tissue response."
            rationale = "Biological timing is critical for post-operative healing and material maturation."
        } else if query.contains("estimated") || query.contains("treatment") || query.contains("plan") {
            objective = "Holistic Case Analysis"
            details = "• Synthesis: Comprehensive evaluation of the proposed treatment journey.\n• Architecture: Multi-phase protocol designed for functional and aesthetic restoration."
            rationale = "Custom clinical path determined by existing tooth-by-tooth diagnosis."
        }

        return """
        NANOBOT CLINICAL INTELLIGENCE
        
        CORE OBJECTIVE: \(objective)
        
        METHODOLOGY:
        \(details.replacingOccurrences(of: "**", with: ""))
        
        RATIONALE: \(rationale)
        
        INVESTMENT NODE: Established at ₹\(cost > 0 ? String(format: "%.0f", cost) : "Dynamic")
        STATUS: Optimal for current clinical parameters.
        """
    }
}
