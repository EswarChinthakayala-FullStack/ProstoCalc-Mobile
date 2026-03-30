import Foundation

struct PromptBuilder {
    static func buildCostExplanationPrompt(items: [PlanItem], total: Double) -> String {
        if items.isEmpty {
            return "No treatment plan is currently available for analysis. Please ensure a plan has been designed by your clinician."
        }
        
        let procedures = items.map { "- \($0.name) (Tooth #\($0.toothNumber)): ₹\($0.cost) [Estimate: \($0.sessions) visit(s)]" }.joined(separator: "\n")
        
        return """
        You are a professional dental treatment case analyst.
        
        TREATMENT DOSSIER:
        \(procedures)
        
        TOTAL FINANCIAL COMMITMENT: ₹\(total)
        
        REQUIREMENT:
        Provide a realistic, professional explanation that covers:
        1. CLINICAL PURPOSE: Why are these procedures necessary?
        2. COST ARCHITECTURE: Breakdown of why the investment is ₹\(total).
        3. TEMPORAL FLOW: Explain the timeline across the sessions mentioned.
        4. OUTCOME: What is the benefit of following this plan?
        
        CRITICAL RULES:
        - Use clinical but accessible language.
        - Mention specific session counts for each procedure.
        - Maintain total neutrality; NO medical advice or guarantees.
        - Ensure a brief disclaimer is included at the end.
        """
    }
}
