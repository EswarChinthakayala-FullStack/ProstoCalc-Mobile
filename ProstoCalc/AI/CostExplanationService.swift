import Foundation

class CostExplanationService {
    static let shared = CostExplanationService()
    private init() {}
    
    func explain(items: [PlanItem], total: Double, completion: @escaping (Result<String, Error>) -> Void) {
        let prompt = PromptBuilder.buildCostExplanationPrompt(items: items, total: total)
        
        // Pass to On-Device Manager
        OpenELMManager.shared.generateExplanation(prompt: prompt) { result in
            completion(result)
        }
    }
}
